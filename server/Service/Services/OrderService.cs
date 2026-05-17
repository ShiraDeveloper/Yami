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
        _logger.LogInformation("DISPATCH STARTED");

        using (var scope = _scopeFactory.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<YamiDbContext>();
            var order = await db.Orders.Include(o => o.Store).FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null || order.Status == OrderStatus.InProgress || order.Status == OrderStatus.Canceled) return false;

            // שליפת השליחים הפנויים + טעינת ה-User עבור מיקומי הגיבוי
            var allCouriers = await db.Couriers.Include(c => c.User)
                .Where(c => c.IsAvailable && c.RemainingBoxVolume >= order.TotalVolume)
                .ToListAsync();

            _logger.LogInformation($"ALL COURIERS: {allCouriers.Count}");

            var rankedCouriers = await BuildRankedCouriers(order.DeliveryLatitude, order.DeliveryLongitude, allCouriers, order);

            _logger.LogInformation($"RANKED COURIERS: {rankedCouriers.Count}");

            // שינוי תוספת: אם אין שליחים רלוונטיים בכלל באלגוריתם, נבטל את ההזמנה מיד
            if (rankedCouriers.Count == 0)
            {
                _logger.LogInformation($"[Dispatch] No ranked couriers found for Order {order.Id}. Cancelling order.");
                order.Status = OrderStatus.Canceled;
                await db.SaveChangesAsync();
                return false;
            }

            int waveSize = 3;
            int waveIndex = 0;

            while (waveIndex < rankedCouriers.Count)
            {
                var currentWave = rankedCouriers.Skip(waveIndex).Take(waveSize).ToList();

                // 1. שליחת ההצעות לכל חברי הגל הנוכחי במקביל
                foreach (var item in currentWave)
                {
                    var courier = item.Courier;

                    var newOffer = new DeliveryOffer
                    {
                        OrderId = order.Id,
                        CourierId = courier.Id,
                        OfferedAt = DateTime.UtcNow,
                        Accepted = null
                    };
                    db.DeliveryOffer.Add(newOffer);

                    // התיקון המרכזי: שליחה ישירה ל-Group לפי ה-UserId שנמצא תמיד על אובייקט ה-Courier
                    _logger.LogInformation($"[Dispatch] Sending SignalR to Group user-{courier.UserId} for Order {order.Id}");
                    await _hubContext.Clients.Group($"user-{courier.UserId}")
                        .SendAsync("NewOrderAssigned", new
                        {
                            orderId = order.Id,
                            storeName = order.Store?.Name ?? "Yami",
                            storeAddress = order.Store?.Address ?? "כתובת לא צוינה", // תואם לציפייה ב-React לקבלת כתובת חנות
                            totalVolume = order.TotalVolume
                        });
                }

                // שמירת כל ההצעות של הגל הנוכחי במכה אחת
                await db.SaveChangesAsync();

                // 2. המתנה של 20 שניות עבור הגל כולו ובדיקה אם מישהו מהם אישר
                for (int i = 0; i < 10; i++) // 10 סיבובים של 2 שניות = 20 שניות סך הכל
                {
                    await Task.Delay(2000);

                    using (var checkScope = _scopeFactory.CreateScope())
                    {
                        var checkDb = checkScope.ServiceProvider.GetRequiredService<YamiDbContext>();
                        var currentOrderStatus = await checkDb.Orders
                            .Where(o => o.Id == orderId)
                            .Select(o => o.Status)
                            .FirstOrDefaultAsync();

                        if (currentOrderStatus == OrderStatus.InProgress)
                        {
                            _logger.LogInformation($"Order {orderId} accepted by a courier. Stopping dispatch.");
                            return true;
                        }
                    }
                }

                // 3. רק לאחר שכל הגל הנוכחי קיבל הזדמנות והזמן עבר - מתקדמים לגל הבא
                waveIndex += waveSize;
            }

            // ====================================================================
            // 🛑 מנגנון הביטול האוטומטי: הגענו לכאן? סימן שסיימנו את כל הגלים ואף שליח לא אישר!
            // ====================================================================
            _logger.LogInformation($"[Dispatch] All waves completed. No courier accepted Order {order.Id}. Changing status to Canceled.");

            order.Status = OrderStatus.Canceled; // עדכון הסטטוס לביטול

            // נסמן גם את כל ההצעות שלא נענו בגל האחרון כדחויות אוטומטית
            var remainingOffers = await db.DeliveryOffer
                .Where(doffer => doffer.OrderId == order.Id && doffer.Accepted == null)
                .ToListAsync();

            foreach (var offer in remainingOffers)
            {
                offer.Accepted = false;
            }

            await db.SaveChangesAsync(); // שמירה סופית של הביטול בבסיס הנתונים
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
            // 1. סינון שליחים שדחו כבר את ההזמנה הזו
            if (_orderRejections.TryGetValue(incomingOrder.Id, out var rejectedIds) && rejectedIds.Contains(c.Id)) continue;

            // 2. בדיקת עומס הזמנות באמצעות שדה הקיבולת/נפח הפנוי (TotalVolume משמש כאינדיקטור להזמנות פתוחות)
            var activeOrders = allOrders.Where(o => o.CourierId == c.Id && o.Status != OrderStatus.Delivered && o.Status != OrderStatus.Canceled).ToList();

            // שימוש ב-TotalVolume של השליח כדי לבדוק אם הוא הגיע למקסימום ההזמנות הפתוחות שלו
            if (c.TotalDeliveries >= MAX_ACTIVE_ORDERS || activeOrders.Count >= MAX_ACTIVE_ORDERS) continue;

            // 3. שליפת המיקום האחרון מטבלת הטרקינג
            var lastPos = allTracking.Where(x => x.CourierId == c.Id).OrderByDescending(x => x.Timestamp).FirstOrDefault();

            double courierLat;
            double courierLng;

            // --- מנגנון הגיבוי (Fallback) ---
            if (lastPos != null)
            {
                // אם נמצא מיקום לייב בטבלה - נשתמש בו
                courierLat = lastPos.Latitude;
                courierLng = lastPos.Longitude;
            }
            else
            {
                // אם לא נמצא מיקום (null) - לוקחים את מיקום ברירת המחדל מטבלת ה-User ולא מפעילים continue!
                courierLat = c.User?.Latitude ?? 0;
                courierLng = c.User?.Longitude ?? 0;
            }

            // 4. בדיקה האם השליח מסוגל לעמוד בזמני המסלול (נשלח אובייקט מיקום זמני אם lastPos היה null)
            var trackingContext = lastPos ?? new CourierTracking { Latitude = courierLat, Longitude = courierLng };
            if (!CanCourierHandleRouteWithinTime(activeOrders, incomingOrder, trackingContext)) continue;

            // 5. חישוב המרחק והוספה לרשימה
            var dist = CalculateDistance(lat, lng, courierLat, courierLng);
            result.Add((c, dist));
        }

        // החזרה של השליחים כשהם ממוינים מהקרוב ביותר לרחוק ביותר
        return result.OrderBy(x => x.Distance).ToList();
    }

    private bool CanCourierHandleRouteWithinTime(List<Order> activeOrders, Order newOrder, CourierTracking lastPos)
    {
        double currentLat = lastPos.Latitude;
        double currentLng = lastPos.Longitude;
        double accumulatedTime = 0;
        var remainingStops = activeOrders.Concat(new[] { newOrder }).ToList();

        while (remainingStops.Any())
        {
            var next = remainingStops.OrderBy(o => CalculateDistance(currentLat, currentLng, o.DeliveryLatitude, o.DeliveryLongitude)).First();
            var dist = CalculateDistance(currentLat, currentLng, next.DeliveryLatitude, next.DeliveryLongitude);
            accumulatedTime += ((dist / AVERAGE_SPEED_KMPH) * 60) + 5;
            if ((DateTime.UtcNow - next.CreatedAt).TotalMinutes + accumulatedTime > MAX_DELIVERY_MINUTES) return false;
            currentLat = next.DeliveryLatitude;
            currentLng = next.DeliveryLongitude;
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
        await _hubContext.Clients.All
    .SendAsync("OrderTaken", new
    {
        orderId = orderId
    });
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