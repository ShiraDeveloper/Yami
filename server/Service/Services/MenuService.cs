using Repository.Entities;
using Repository.Interfaces;
using Service.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Service.Implementations
{
    public class MenuService : IMenuService
    {
        private readonly IRepository<Menu> _menuRepository;
        private readonly IRepository<Store> _storeRepository;

        public MenuService(IRepository<Menu> menuRepository, IRepository<Store> storeRepository)
        {
            _menuRepository = menuRepository;
            _storeRepository = storeRepository;
        }

        // CRUD מ‑IService
        public async Task<Menu> Add(Menu entity)
        {
            return await _menuRepository.Add(entity);
        }

        public async Task<Menu> Update(int id, Menu entity)
        {
            var menu = await _menuRepository.GetById(id);
            if (menu == null) return null;

            menu.ItemName = entity.ItemName;
            menu.Price = entity.Price;
            menu.Category = entity.Category;
            menu.Volume = entity.Volume;

            return await _menuRepository.Update(menu);
        }

        public async Task<Menu> Delete(int id)
        {
            return await _menuRepository.Delete(id);
        }

        public async Task<List<Menu>> GetAll()
        {
            return await _menuRepository.GetAll();
        }

        public async Task<Menu> GetById(int id)
        {
            return await _menuRepository.GetById(id);
        }

        // פונקציות מותאמות אישית
        public async Task<List<Menu>> SearchMenus(string? search, MenuCategory? category)
        {
            var menus = await _menuRepository.GetAll();

            if (!string.IsNullOrEmpty(search))
                menus = menus.Where(m => m.ItemName.Contains(search, System.StringComparison.OrdinalIgnoreCase)).ToList();

            if (category.HasValue)
                menus = menus.Where(m => m.Category == category).ToList();

            return menus;
        }

        public Task<Menu> GetMenuById(int id)
        {
            return _menuRepository.GetById(id);
        }
        public async Task<List<Menu>> GetMenusByStoreId(int storeId)
        {
            var menus = await _menuRepository.GetAll();

            return menus
                .Where(m => m.StoreId == storeId)
                .ToList();
        }
    }
}