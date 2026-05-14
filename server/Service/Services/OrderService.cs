using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Service.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Common.Hubs;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using DataContext;
using Microsoft.EntityFrameworkCore;

public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IRepository<Courier> _courierRepository;
    private readonly IRepository<CourierTracking> _trackingRepository;
    private readonly IHubContext<TrackingHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<OrderService> _logger;
    private readonly YamiDbContext _db;

    private static readonly ConcurrentDictionary<int, List<int>> _orderRejections = new();

    private const int MAX_ACTIVE_ORDERS = 3;
    private const int MAX_DELIVERY_MINUTES = 40;
    private const double AVERAGE_SPEED_KMPH = 30.0;

    public OrderService(
        IOrderRepository orderRepository,
        IRepository<Courier> courierRepository,
        IRepository<CourierTracking> trackingRepository,
        IHubContext<TrackingHub> hubContext,
        IServiceScopeFactory scopeFactory,
        ILogger<OrderService> logger,
        YamiDbContext db)
    {
        _orderRepository = orderRepository;
        _courierRepository = courierRepository;
        _trackingRepository = trackingRepository;
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
        _logger = logger;
        _db = db;
    }

    public async Task<int> GetCourierIdByUserId(int userId)
    {
        var courier = await _db.Couriers.FirstOrDefaultAsync(c => c.UserId == userId);
        return courier?.Id ?? 0;
    }

    public void RegisterRejection(int orderId, int courierId)
    {
        var list = _orderRejections.GetOrAdd(orderId, _ => new List<int>());
        lock (list)
        {
            if (!list.Contains(courierId)) list.Add(courierId);
        }
    }

    public async Task<Order?> CreateOrder(int customerId, OrderCreateDto dto)
    {
        if (dto.StoreId <= 0) throw new Exception("חנות לא זמינה");

        var order = new Order
        {
            CustomerId = customerId,
            StoreId = dto.StoreId,
            DeliveryLatitude = dto.DeliveryLatitude,
            DeliveryLongitude = dto.DeliveryLongitude,
            Address = dto.Address,
            Status = OrderStatus.Approved,
            CreatedAt = DateTime.UtcNow,
            TotalVolume = dto.OrderItems?.Sum(i => i.Quantity) ?? 0,
            OrderItems = dto.OrderItems?.Select(i => new OrderItem
            {
                MenuId = i.MenuItemId,
                Quantity = i.Quantity
            }).ToList()
        };

        await _orderRepository.Add(order);

        _ = Task.Run(async () =>
        {
            using var scope = _scopeFactory.CreateScope();
            var scopedService = scope.ServiceProvider.GetRequiredService<IOrderService>();
            await scopedService.DispatchOrderSequential(order.Id);
        });

        return order;
    }

    public async Task<bool> DispatchOrderSequential(int orderId)
    {
        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<YamiDbContext>();
            var order = await db.Orders.Include(o => o.Store).FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null || order.Status == OrderStatus.InProgress) return false;

            var allCouriers = await db.Couriers.Include(c => c.User)
                .Where(c => c.IsAvailable && c.RemainingBoxVolume >= order.TotalVolume)
                .ToListAsync();

            var rankedCouriers = await BuildRankedCouriers(order.DeliveryLatitude, order.DeliveryLongitude, allCouriers, order);

            int waveSize = 3;
            int waveIndex = 0;

            while (waveIndex < rankedCouriers.Count)
            {
                var currentWave = rankedCouriers.Skip(waveIndex).Take(waveSize).ToList();

                foreach (var item in currentWave)
                {
                    var courier = item.Courier;

                    // תיקון קריטי: קישור ל-OrderID של ההזמנה הנוכחית
                    var newOffer = new DeliveryOffer
                    {
                        DeliveryOrderId = order.Id, // מוודא שזה מצביע לטבלת Orders
                        CourierId = courier.Id,
                        OfferedAt = DateTime.UtcNow,
                        Accepted = null
                    };
                    db.DeliveryOffer.Add(newOffer);

                    if (courier.User != null)
                    {
                        _logger.LogInformation($"[Dispatch] Sending SignalR to Courier User {courier.UserId}");
                        await _hubContext.Clients.User(courier.UserId.ToString())
                            .SendAsync("NewOrderAssigned", new
                            {
                                orderId = order.Id,
                                storeName = order.Store?.Name ?? "Yami",
                                totalVolume = order.TotalVolume
                            });
                    }
                }

                await db.SaveChangesAsync();

                var startWait = DateTime.UtcNow;
                while ((DateTime.UtcNow - startWait).TotalSeconds < 20)
                {
                    var checkOrder = await db.Orders.AsNoTracking().FirstOrDefaultAsync(o => o.Id == orderId);
                    if (checkOrder?.Status == OrderStatus.InProgress) return true;
                    await Task.Delay(2000);
                }

                waveIndex += waveSize;
            }
        }
        return false;
    }

    private async Task<List<(Courier Courier, double Distance)>> BuildRankedCouriers(double lat, double lng, List<Courier> couriers, Order incomingOrder)
    {
        var result = new List<(Courier Courier, double Distance)>();
        var allOrders = await _orderRepository.GetAll();
        var allTracking = await _trackingRepository.GetAll();

        foreach (var c in couriers)
        {
            if (_orderRejections.TryGetValue(incomingOrder.Id, out var rejectedIds) && rejectedIds.Contains(c.Id)) continue;

            var activeOrders = allOrders.Where(o => o.CourierId == c.Id && o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Canceled).ToList();
            if (activeOrders.Count >= MAX_ACTIVE_ORDERS) continue;

            var lastPos = allTracking.Where(x => x.CourierId == c.Id).OrderByDescending(x => x.Timestamp).FirstOrDefault();
            if (lastPos == null) continue;

            if (!CanCourierHandleRouteWithinTime(activeOrders, incomingOrder, lastPos)) continue;

            var dist = CalculateDistance(lat, lng, lastPos.Latitude, lastPos.Longitude);
            result.Add((c, dist));
        }
        return result.OrderBy(x => x.Distance).ToList();
    }

    private bool CanCourierHandleRouteWithinTime(List<Order> activeOrders, Order newOrder, CourierTracking lastPos)
    {
        double currentLat = lastPos.Latitude; double currentLng = lastPos.Longitude;
        double accumulatedTime = 0;
        var remainingStops = activeOrders.Concat(new[] { newOrder }).ToList();

        while (remainingStops.Any())
        {
            var next = remainingStops.OrderBy(o => CalculateDistance(currentLat, currentLng, o.DeliveryLatitude, o.DeliveryLongitude)).First();
            var dist = CalculateDistance(currentLat, currentLng, next.DeliveryLatitude, next.DeliveryLongitude);
            accumulatedTime += ((dist / AVERAGE_SPEED_KMPH) * 60) + 5;
            if ((DateTime.UtcNow - next.CreatedAt).TotalMinutes + accumulatedTime > MAX_DELIVERY_MINUTES) return false;
            currentLat = next.DeliveryLatitude; currentLng = next.DeliveryLongitude;
            remainingStops.Remove(next);
        }
        return true;
    }

    public async Task<Order> UpdateStatus(int orderId, OrderStatus status, int userId, string role)
    {
        var order = await _orderRepository.GetById(orderId) ?? throw new Exception("Order not found");
        order.Status = status;
        if (status == OrderStatus.Delivered) order.DeliveredAt = DateTime.UtcNow;
        await _orderRepository.Update(order);
        return order;
    }

    public async Task<Order> AssignCourier(int orderId, int courierId)
    {
        var order = await _orderRepository.GetById(orderId) ?? throw new Exception("Order not found");
        var courier = await _courierRepository.GetById(courierId) ?? throw new Exception("Courier not found");
        order.CourierId = courier.Id;
        order.Status = OrderStatus.InProgress;
        await _orderRepository.Update(order);
        return order;
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) + Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) * Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    public Task<Order?> GetById(int id) => _orderRepository.GetById(id);
    public async Task<List<Order>> GetAll() => (await _orderRepository.GetAll()).ToList();
    public async Task<List<Order>> GetOrdersByCourier(int courierId) => await _orderRepository.GetOrdersByCourierWithDetailsAsync(courierId);
    public async Task<List<Order>> GetOrdersByUserId(int userId) => await _orderRepository.GetByCustomerIdAsync(userId);
}