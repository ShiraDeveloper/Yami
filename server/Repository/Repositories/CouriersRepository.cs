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
    public class CouriersRepository : IRepository<Courier>
    {
        private readonly IContext ctx;

        public CouriersRepository(IContext context)
        {
            ctx = context;
        }

        public async Task<Courier> Add(Courier entity)
        {
            ctx.Couriers.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<Courier> Delete(int id)
        {
            var c = await ctx.Couriers.FirstOrDefaultAsync(x => x.Id == id);

            if (c == null)
                return null;

            ctx.Couriers.Remove(c);
            await ctx.Save();
            return c;
        }

        public Task<List<Courier>> GetAll()
        {
            return ctx.Couriers
                .Include(c => c.User)
                .ToListAsync();
        }

        public async Task<Courier> GetById(int id)
        {
            return await ctx.Couriers
                .Include(c => c.User)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Courier> Update(Courier entity)
        {
            var existing = await ctx.Couriers
                .FirstOrDefaultAsync(x => x.Id == entity.Id);

            if (existing == null)
                return null;

            existing.IsAvailable = entity.IsAvailable;
            existing.MaxBoxVolume = entity.MaxBoxVolume;
            existing.RemainingBoxVolume = entity.RemainingBoxVolume;
            existing.TotalDeliveries = entity.TotalDeliveries;

            await ctx.Save();
            return existing;
        }
    }
}
