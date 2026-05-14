using Repository.Entities;
using Repository.Interfaces;

public class CourierRouteEngine
{
    private readonly IRepository<Order> _orderRepository;
    private readonly IRepository<CourierTracking> _trackingRepository;

    private const double SPEED_KM_PER_MIN = 0.5; // ~30km/h
    private const int MAX_DELIVERY_MINUTES = 40;

    public CourierRouteEngine(
        IRepository<Order> orderRepository,
        IRepository<CourierTracking> trackingRepository)
    {
        _orderRepository = orderRepository;
        _trackingRepository = trackingRepository;
    }

    // ================= MAIN FUNCTION =================
    public async Task<(bool CanTakeOrder, double TotalTime)> CanCourierAcceptNewOrder(
        Courier courier,
        Order newOrder)
    {
        var allOrders = await _orderRepository.GetAll();

        var activeOrders = allOrders
            .Where(o => o.CourierId == courier.Id &&
                        o.Status != OrderStatus.Delivered &&
                        o.Status != OrderStatus.Canceled)
            .ToList();

        var lastLocation = await GetLastLocation(courier.Id);

        if (lastLocation == null)
            return (false, 0);

        double totalTime = 0;

        double currentLat = lastLocation.Latitude;
        double currentLng = lastLocation.Longitude;

        var route = activeOrders
            .Concat(new[] { newOrder })
            .OrderBy(o => o.CreatedAt) // בסיסי, אפשר לשפר בהמשך
            .ToList();

        foreach (var order in route)
        {
            // 🚚 חישוב זמן נסיעה
            var distance = CalculateDistance(
                currentLat,
                currentLng,
                order.DeliveryLatitude,
                order.DeliveryLongitude);

            var travelTime = distance / SPEED_KM_PER_MIN;

            totalTime += travelTime;

            // ⏱️ TTL CHECK
            var elapsed = (DateTime.UtcNow - order.CreatedAt).TotalMinutes;
            var remainingTTL = MAX_DELIVERY_MINUTES - elapsed;

            if (totalTime > remainingTTL)
                return (false, totalTime);

            currentLat = order.DeliveryLatitude;
            currentLng = order.DeliveryLongitude;
        }

        return (true, totalTime);
    }

    // ================= GET LAST LOCATION =================
    private async Task<CourierTracking?> GetLastLocation(int courierId)
    {
        return (await _trackingRepository.GetAll())
            .Where(x => x.CourierId == courierId)
            .OrderByDescending(x => x.Timestamp)
            .FirstOrDefault();
    }

    // ================= DISTANCE =================
    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371;

        var dLat = ToRad(lat2 - lat1);
        var dLon = ToRad(lon2 - lon1);

        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRad(lat1)) * Math.Cos(ToRad(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

        return R * c;
    }

    private double ToRad(double deg) => deg * Math.PI / 180;
}