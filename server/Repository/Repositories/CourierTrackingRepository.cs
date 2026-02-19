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
    internal class CourierTrackingRepository : IRepository<CourierTracking>
    {
        private readonly IContext ctx;
        public CourierTrackingRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<CourierTracking> Add(CourierTracking entity)
        {
            ctx.CourierTracking.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<CourierTracking> Delete(int id)
        {
            var c = await ctx.CourierTracking.FirstOrDefaultAsync(x => x.Id == id);
            if (c != null)
            {
                ctx.CourierTracking.Remove(c);
                await ctx.Save();
                return c;
            }
            return null;
        }

        public Task<List<CourierTracking>> GetAll()
        {
            return ctx.CourierTracking.ToListAsync();
        }

        public async Task<CourierTracking> GetById(int id)
        {
            return await ctx.CourierTracking.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<CourierTracking> Update(CourierTracking entity)
        {
            var existingCourierTracking = await ctx.CourierTracking.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingCourierTracking == null)
                return null;
            existingCourierTracking.CourierId = entity.CourierId;
            existingCourierTracking.Id = entity.Id;
            existingCourierTracking.Latitude = entity.Latitude;
            existingCourierTracking.Longitude = entity.Longitude;
            existingCourierTracking.Timestamp = entity.Timestamp;
            existingCourierTracking.Order = entity.Order;
            existingCourierTracking.OrderId = entity.OrderId;
            existingCourierTracking.Courier = entity.Courier;
            await ctx.Save();
            return existingCourierTracking;
        }
    }
}
