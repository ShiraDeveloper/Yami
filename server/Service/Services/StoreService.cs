using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Service.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace Service.Services
{
    public class StoreService : IStoreService
    {
        private readonly IRepository<Store> _storeRepository;

        public StoreService(IRepository<Store> storeRepository)
        {
            _storeRepository = storeRepository;
        }

        public async Task<List<StoreDto>> GetStores(double userLat, double userLng, string? search, string? kosher)
        {
            // 1. שליפת כל החנויות ממסד הנתונים
            var stores = await _storeRepository.GetAll();

            // 2. סינון חנויות שיש להן מיקום תקין בלבד (הורדנו מכאן את החסימה של s.IsOpen)
            stores = stores
                .Where(s => s.Latitude.HasValue && s.Longitude.HasValue)
                .ToList();

            // 3. סינון לפי טקסט חופשי (חיפוש שם החנות)
            if (!string.IsNullOrEmpty(search))
            {
                stores = stores
                    .Where(s => s.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // 4. סינון לפי תגיות כשרות
            if (!string.IsNullOrEmpty(kosher))
            {
                stores = stores
                    .Where(s => !string.IsNullOrEmpty(s.KosherTags) &&
                                s.KosherTags.Contains(kosher, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            // 5. מציאת הסניף הקרוב ביותר מבין חנויות בעלות אותו שם (למניעת כפילויות ברשתות)
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

            // 6. מיפוי ל-DTO וחישוב הסטטוס הדינמי (פתוח/סגור) לכל חנות בנפרד
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

                    // 🌟 השינוי הקריטי: חישוב דינמי לפי השעה הנוכחית האמיתית
                    IsOpen = IsStoreOpenNow(s.OpenHours),

                    Phone = s.Phone,
                    OwnerId = s.OwnerId,
                    DistanceFromUser = HaversineDistance(
                        userLat,
                        userLng,
                        s.Latitude!.Value,
                        s.Longitude!.Value)
                })
                .OrderBy(s => s.DistanceFromUser)
                .ToList();

            return storeDtos;
        }
        public async Task<List<StoreDto>> GetAll()
        {
            var stores = await _storeRepository.GetAll();

            return stores.Select(s => new StoreDto
            {
                Id = s.Id,
                Name = s.Name,
                Address = s.Address,
                Latitude = s.Latitude ?? 0,
                Longitude = s.Longitude ?? 0,
                KosherTags = s.KosherTags,
                OpenHours = s.OpenHours,
                IsOpen = IsStoreOpenNow(s.OpenHours),
                Phone = s.Phone,
                OwnerId = s.OwnerId
            }).ToList();
        }
        public async Task<StoreDto> GetById(int id)
        {
            // 1. שליפת החנות מבסיס הנתונים לפי ה-ID
            var store = await _storeRepository.GetById(id);

            // 2. הגנה: אם החנות לא נמצאה ב-DB, נחזיר null
            if (store == null)
            {
                return null;
            }
            bool storeIsOpenNow = IsStoreOpenNow(store.OpenHours);

            // 3. חישוב בזמן אמת: האם החנות פתוחה כרגע?

            // 4. מיפוי (Mapping) מלא ל-StoreDto שלך
            var storeDto = new StoreDto
            {
                Id = store.Id,
                Name = store.Name,
                Address = store.Address,
                Latitude = store.Latitude,
                Longitude = store.Longitude,
                KosherTags = store.KosherTags,
                OpenHours = store.OpenHours,   // מחזיר את המחרוזת "08:00-22:00"
                IsOpen = storeIsOpenNow,       // 🌟 מעדכן אוטומטית true או false!
                Phone = store.Phone,
                OwnerId = store.OwnerId
                // DistanceFromUser יחושב בהמשך במידת הצורך
            };

            return storeDto;
        }
        public Task<StoreDto> Add(StoreDto entity)
        {
            throw new NotImplementedException();
        }

        public Task<StoreDto> Update(int id, StoreDto entity)
        {
            throw new NotImplementedException();
        }

        public Task<StoreDto> Delete(int id)
        {
            throw new NotImplementedException();
        }

        private static double HaversineDistance(double lat1, double lng1, double lat2, double lng2)
        {
            const double R = 6371;

            double dLat = ToRadians(lat2 - lat1);
            double dLng = ToRadians(lng2 - lng1);

            double a =
                Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                Math.Sin(dLng / 2) * Math.Sin(dLng / 2);

            double c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

            return R * c;
        }

        public bool IsStoreOpenNow(string openingHoursString)
        {
            // הגנה: אם השדה ב-Database ריק או null, נניח שהחנות סגורה
            if (string.IsNullOrWhiteSpace(openingHoursString))
            {
                return false;
            }

            try
            {
                // 1. פירוק המחרוזת לפי המקף (-)
                // "08:00-22:00" הופך למערך של שני איברים: ["08:00", "22:00"]
                var parts = openingHoursString.Split('-');
                if (parts.Length != 2)
                {
                    return false; // אם הפורמט בטעות לא תקין ב-DB
                }

                // 2. המרת הטקסט של שעת הפתיחה ושעת הסגירה לזמן אמיתי (TimeSpan)
                TimeSpan openTime = TimeSpan.Parse(parts[0].Trim()); // יהפוך ל- 08:00:00
                TimeSpan closeTime = TimeSpan.Parse(parts[1].Trim()); // יהפוך ל- 22:00:00

                // 3. חילוץ השעה הנוכחית של השרת (לפי השעון של המחשב/שרת כרגע)
                TimeSpan currentTime = DateTime.Now.TimeOfDay;

                // 4. בדיקת טווח השעות
                if (openTime <= closeTime)
                {
                    // מקרה רגיל: שעת הסגירה באותו היום (למשל מ-08:00 בבוקר עד 22:00 בלילה)
                    return currentTime >= openTime && currentTime <= closeTime;
                }
                else
                {
                    // מקרה קצה: חנויות שפתוחות מעבר לחצות (למשל מ-18:00 בערב עד 02:00 לפנות בוקר של היום למחרת)
                    return currentTime >= openTime || currentTime <= closeTime;
                }
            }
            catch (Exception ex)
            {
                // אם ההמרה נכשלה בגלל טקסט לא חוקי שמישהו הכניס בטעות ל-DB
                Console.WriteLine($"Error parsing opening hours: {ex.Message}");
                return false;
            }
        }


        private static double ToRadians(double angle) => angle * (Math.PI / 180);
    }
}