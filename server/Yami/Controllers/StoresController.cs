using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Common.Dto;
using Repository.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoresController : ControllerBase
    {
        private readonly IRepository<Store> _storeRepository;

        public StoresController(IRepository<Store> storeRepository)
        {
            _storeRepository = storeRepository;
        }

        // GET: api/stores?userLat=..&userLng=..&search=OptionalName&kosher=OptionalKosher
        [HttpGet]
        public async Task<ActionResult<List<StoreDto>>> GetStores(
            [FromQuery] double userLat,
            [FromQuery] double userLng,
            [FromQuery] string? search = null,
            [FromQuery] string? kosher = null)
        {
            // שליפת כל החנויות
            var stores = await _storeRepository.GetAll();

            // סינון חנויות ללא מיקום
            stores = stores
                .Where(s => s.Latitude.HasValue && s.Longitude.HasValue)
                .ToList();

            // סינון רק חנויות פתוחות
            stores = stores
                .Where(s => s.IsOpen)
                .ToList();

            // סינון לפי חיפוש שם אם נשלח
            if (!string.IsNullOrEmpty(search))
            {
                stores = stores
                    .Where(s => s.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // סינון לפי כשרות אם נשלח
            if (!string.IsNullOrEmpty(kosher))
            {
                stores = stores
                    .Where(s => !string.IsNullOrEmpty(s.KosherTags) &&
                                s.KosherTags.Contains(kosher, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // עבור כל רשת חנויות – בחר את הסניף הקרוב ביותר
            var closestStores = stores
                .GroupBy(s => s.Name)
                .Select(g =>
                    g.OrderBy(s =>
                        HaversineDistance(
                            userLat,
                            userLng,
                            s.Latitude!.Value,
                            s.Longitude!.Value))
                    .First()
                )
                .ToList();

            // המרה ל DTO + חישוב מרחק
            var storeDtos = closestStores
                .Select(s => new StoreDto
                {
                    Id = s.Id,
                    Name = s.Name,
                    Address = s.Address,
                    Latitude = s.Latitude!.Value,
                    Longitude = s.Longitude!.Value,
                    KosherTags = s.KosherTags,
                    OpenHours = s.OpenHours,
                    IsOpen = s.IsOpen,
                    Phone = s.Phone,
                    OwnerId = s.OwnerId,
                    DistanceFromUser = HaversineDistance(
                        userLat,
                        userLng,
                        s.Latitude!.Value,
                        s.Longitude!.Value)
                })
                .OrderBy(s => s.DistanceFromUser) // מהקרוב לרחוק
                .ToList();

            return Ok(storeDtos);
        }

        // חישוב מרחק בין שתי נקודות
        private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371; // רדיוס כדור הארץ בק"מ

            double dLat = ToRadians(lat2 - lat1);
            double dLng = ToRadians(lng2 - lng1);

            double a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        private static double ToRadians(double angle) => angle * (Math.PI / 180);
    }
}