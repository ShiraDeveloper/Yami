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
    internal class CouriersRepository : IRepository<Couriers>
    {
        private readonly IContext ctx;
        public CouriersRepository(IContext context)
        {
            ctx = context;
        }

        public async Task<Couriers> Add(Couriers entity)
        {
            ctx.Couriers.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<Couriers> Delete(int id)
        {
            var c = await ctx.Couriers.FirstOrDefaultAsync(x => x.UserId == id);
            if (c != null)
            {
                ctx.Couriers.Remove(c);
                await ctx.Save();
                return c;
            }
            return null;
        }

        public Task<List<Couriers>> GetAll()
        {
            return ctx.Couriers.ToListAsync();
        }

        public async Task<Couriers> GetById(int id)
        {
            return await ctx.Couriers.FirstOrDefaultAsync(x => x.UserId == id);
        }

        public async Task<Couriers> Update(Couriers entity)
        {
            var existingCourier = await ctx.Couriers.FirstOrDefaultAsync(x => x.UserId == entity.UserId);
            if (existingCourier == null)
                return null;
            existingCourier.UserId = entity.UserId;
            existingCourier.CurrentLocation = entity.CurrentLocation;
            existingCourier.Availability = entity.Availability;
            existingCourier.TotalDeliveries = entity.TotalDeliveries;
            existingCourier.SalaryStatus = entity.SalaryStatus;
            existingCourier.LastUpdate = entity.LastUpdate;
            existingCourier.MaxBoxVolume = entity.MaxBoxVolume;
            existingCourier.RemainingBoxVolume = entity.RemainingBoxVolume;
            await ctx.Save();
            return existingCourier;
        }
    }
}
