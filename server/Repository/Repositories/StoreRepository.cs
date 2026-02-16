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
    public class StoreRepository : IRepository<Stores>
    {
        private readonly IContext ctx;
        public StoreRepository(IContext context)
        {
            ctx=context;
        }
        public async Task<Stores> Add(Stores store)
        {
            ctx.Stores.Add(store);
            await ctx.Save();
            return store;
        }

        public async Task<Stores> Delete(int id)
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

        public Task<List<Stores>> GetAll()
        {
            return ctx.Stores.ToListAsync();
        }

        public async Task<Stores> GetById(int id)
        {
            return await ctx.Stores.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Stores> Update(Stores store)
        {
            var existingStore = await ctx.Stores.FirstOrDefaultAsync(x => x.Id == store.Id);
            if (existingStore == null)
                return null;
            existingStore.OpenHours = store.OpenHours;
            existingStore.IsOpen = store.IsOpen;
            existingStore.Name = store.Name;
            existingStore.KosherTags = store.KosherTags;
            existingStore.Address = store.Address;
            existingStore.Owner = store.Owner;
            existingStore.Id = store.Id;
            existingStore.Phone = store.Phone;
            await ctx.Save();
            return existingStore;
        }
    }
}
