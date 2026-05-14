using Repository.Entities;
using Service.Interfaces;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Service.Interfaces
{
    public interface IMenuService : IService<Menu>
    {
        Task<List<Menu>> SearchMenus(string? search, MenuCategory? category);
        Task<Menu> GetMenuById(int id); // אם רוצים לאפשר שימוש נפרד מלבד GetById של IService
        Task<List<Menu>> GetMenusByStoreId(int storeId);
    }
}