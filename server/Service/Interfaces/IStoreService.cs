using Common.Dto;

namespace Service.Interfaces
{
    public interface IStoreService : IService<StoreDto>
    {
        Task<List<StoreDto>> GetStores(
            double userLat,
            double userLng,
            string? search,
            string? kosher
        );
    }
}