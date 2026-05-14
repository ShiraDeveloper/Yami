using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Service.Services
{
    public class CourierMatchingService : ICourierMatchingService
    {
        private readonly ICourierRepository _courierRepository;
        private readonly ILogger<CourierMatchingService> _logger;

        public CourierMatchingService(ICourierRepository courierRepository, ILogger<CourierMatchingService> logger)
        {
            _courierRepository = courierRepository;
            _logger = logger;
        }

        public async Task<int?> FindBestCourier(double orderLat, double orderLng)
        {
            var couriers = await _courierRepository.GetAll();

            // סינון שליחים פעילים עם נפח פנוי ומיקום תקין
            var availableCouriers = couriers
                .Where(c => c.IsAvailable && c.User != null && c.RemainingBoxVolume > 0 && c.User.Latitude != 0)
                .ToList();

            if (!availableCouriers.Any())
            {
                _logger.LogWarning("No available couriers with location found.");
                return null;
            }

            // שליפת הצעות קודמות שנדחו עבור ההזמנה הזו (כדי לא לשלוח שוב לאותו אדם)
            // הערה: אם DispatchOrderSequential מעביר את ה-AlreadyOfferedIds, כדאי להשתמש בו.

            var sortedCandidates = availableCouriers
                .Select(c => new
                {
                    Courier = c,
                    Distance = CalculateDistance(orderLat, orderLng, c.User!.Latitude, c.User!.Longitude)
                })
                .OrderBy(x => x.Distance)
                .ToList();

            foreach (var candidate in sortedCandidates)
            {
                if (ValidateRouteTime(candidate.Courier, orderLat, orderLng))
                {
                    return candidate.Courier.Id;
                }
            }
            return null;
        }
        private bool ValidateRouteTime(Courier courier, double lat, double lng)
        {
            // לוגיקה פשוטה לבדיקת עומס (ניתן להרחיב לפי הצורך)
            return true;
        }

        private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371;
            var dLat = (lat2 - lat1) * Math.PI / 180;
            var dLon = (lon2 - lon1) * Math.PI / 180;
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }
    }
}