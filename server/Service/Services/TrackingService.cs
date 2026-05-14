using Microsoft.AspNetCore.SignalR;
using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Common.Hubs;

public class TrackingService : ITrackingService
{
    private readonly IRepository<CourierTracking> _trackingRepo;
    private readonly IRepository<Order> _orderRepo;
    private readonly IHubContext<TrackingHub> _hub;

    public TrackingService(
        IRepository<CourierTracking> trackingRepo,
        IRepository<Order> orderRepo,
        IHubContext<TrackingHub> hub)
    {
        _trackingRepo = trackingRepo;
        _orderRepo = orderRepo;
        _hub = hub;
    }

    public async Task UpdateLocation(CourierTrackingCreateDto dto)
    {
        if (dto.Latitude < -90 || dto.Latitude > 90)
            throw new Exception("Invalid latitude");

        if (dto.Longitude < -180 || dto.Longitude > 180)
            throw new Exception("Invalid longitude");

        var tracking = new CourierTracking
        {
            CourierId = dto.CourierId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            OrderId = dto.OrderId,
            Timestamp = DateTime.UtcNow
        };

        await _trackingRepo.Add(tracking);

        if (dto.OrderId != null)
        {
            await _hub.Clients
                .Group(dto.OrderId.ToString()!)
                .SendAsync("ReceiveLocation", dto);
        }
    }

    public async Task<CourierTrackingDto?> GetLocationByOrder(int orderId)
    {
        var last = (await _trackingRepo.GetAll())
            .Where(x => x.OrderId == orderId)
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefault();

        if (last == null)
            return null;

        return new CourierTrackingDto
        {
            CourierId = last.CourierId,
            Latitude = last.Latitude,
            Longitude = last.Longitude,
            Timestamp = last.Timestamp,
            OrderId = last.OrderId
        };
    }
}