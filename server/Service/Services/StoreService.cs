using Repository.Entities;
using Repository.Interfaces;
using Common.Dto;
using Service.Interfaces;

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
            var stores = await _storeRepository.GetAll();

            stores = stores
                .Where(s => s.Latitude.HasValue && s.Longitude.HasValue)
                .Where(s => s.IsOpen)
                .ToList();

            if (!string.IsNullOrEmpty(search))
            {
                stores = stores
                    .Where(s => s.Name.Contains(search, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

            if (!string.IsNullOrEmpty(kosher))
            {
                stores = stores
                    .Where(s => !string.IsNullOrEmpty(s.KosherTags) &&
                                s.KosherTags.Contains(kosher, StringComparison.OrdinalIgnoreCase))
                    .ToList();
            }

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
                IsOpen = s.IsOpen,
                Phone = s.Phone,
                OwnerId = s.OwnerId
            }).ToList();
        }
        public Task<StoreDto> GetById(int id)
        {
            throw new NotImplementedException();
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

        private static double ToRadians(double angle) => angle * (Math.PI / 180);
    }
}