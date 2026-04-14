using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class MenusRepository : IRepository<Menu>
    {
        private readonly IContext ctx;
        public MenusRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<Menu> Add(Menu entity)
        {
            ctx.Menus.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<Menu> Delete(int id)
        {
            var m = await ctx.Menus.FirstOrDefaultAsync(x => x.Id == id);
            if (m != null)
            {
                ctx.Menus.Remove(m);
                await ctx.Save();
                return m;
            }
            return null;
        }

        public Task<List<Menu>> GetAll()
        {
            return ctx.Menus.ToListAsync();
        }

        public async Task<Menu> GetById(int id)
        {
            return await ctx.Menus.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Menu> Update(Menu entity)
        {
            var existingMenus = await ctx.Menus.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingMenus == null)
                return null;
            existingMenus.Id = entity.Id;
            existingMenus.Price= entity.Price;
            existingMenus.Store= entity.Store;
            existingMenus.StoreId= entity.StoreId;
            existingMenus.Category= entity.Category;
            existingMenus.Volume = entity.Volume;
            existingMenus.ItemName = entity.ItemName;
            await ctx.Save();
            return existingMenus;
        }
    }
}
