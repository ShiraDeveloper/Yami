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
    public class DeliveryRepository : IRepository<Delivery>
    {
         private readonly IContext ctx;
        public DeliveryRepository(IContext context)
        {
            ctx = context;
        }

        public async Task<Delivery> Add(Delivery entity)
        {
            ctx.Delivery.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<Delivery> Delete(int id)
        {
            var d = await ctx.Delivery.FirstOrDefaultAsync(x => x.Id == id);
            if (d != null)
            {
                ctx.Delivery.Remove(d);
                await ctx.Save();
                return d;
            }
            return null;
        }

        public Task<List<Delivery>> GetAll()
        {
            return ctx.Delivery.ToListAsync();
        }

        public async Task<Delivery> GetById(int id)
        {
            return await ctx.Delivery.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Delivery> Update(Delivery entity)
        {
            var existingDelivery = await ctx.Delivery.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingDelivery == null)
                return null;
            existingDelivery.Id = entity.Id;
            existingDelivery.CourierId = entity.CourierId;
            existingDelivery.Courier = entity.Courier;
            existingDelivery.IsActive= entity.IsActive;
            existingDelivery.CreatedAt = entity.CreatedAt;
            existingDelivery.DeliveryOrders = entity.DeliveryOrders;
            await ctx.Save();
            return existingDelivery;
        }
    }
}
