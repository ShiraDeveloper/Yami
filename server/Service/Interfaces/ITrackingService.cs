using Common.Dto;

public interface ITrackingService
{
    Task UpdateLocation(CourierTrackingCreateDto dto);
    Task<CourierTrackingDto?> GetLocationByOrder(int orderId);
}