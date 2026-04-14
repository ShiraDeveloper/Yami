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
    public class StoreRepository : IRepository<Store>
    {
        private readonly IContext ctx;
        public StoreRepository(IContext context)
        {
            ctx=context;
        }
        public async Task<Store> Add(Store store)
        {
            ctx.Stores.Add(store);
            await ctx.Save();
            return store;
        }

        public async Task<Store> Delete(int id)
        {
            var s = await ctx.Stores.FirstOrDefaultAsync(x => x.Id == id);
            if (s != null)
            {
                ctx.Stores.Remove(s);
                await ctx.Save();
                return s;
            }
            return null;
        }

        public Task<List<Store>> GetAll()
        {
            return ctx.Stores.ToListAsync();
        }

        public async Task<Store> GetById(int id)
        {
            return await ctx.Stores.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Store> Update(Store store)
        {
            var existingStore = await ctx.Stores.FirstOrDefaultAsync(x => x.Id == store.Id);
            if (existingStore == null)
                return null;
            existingStore.Id = store.Id;
            existingStore.OwnerId= store.OwnerId;
            existingStore.Owner = store.Owner;
            existingStore.OpenHours = store.OpenHours;
            existingStore.IsOpen = store.IsOpen;
            existingStore.Name = store.Name;
            existingStore.KosherTags = store.KosherTags;
            existingStore.Address = store.Address;
            existingStore.Latitude= store.Latitude;
            existingStore.Longitude= store.Longitude;
            existingStore.Phone = store.Phone;
            existingStore.Menus = store.Menus;
            existingStore.Orders = store.Orders;
            await ctx.Save();
            return existingStore;
        }
    }
}
