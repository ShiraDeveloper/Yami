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
    public class DeliveryOrderRepository : IRepository<DeliveryOrder>
    {
        private readonly IContext ctx;
        public DeliveryOrderRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<DeliveryOrder> Add(DeliveryOrder entity)
        {
            ctx.DeliveryOffer.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<DeliveryOrder> Delete(int id)
        {
            var d = await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == id);
            if (d != null)
            {
                ctx.DeliveryOffer.Remove(d);
                await ctx.Save();
                return d;
            }
            return null;
        }

        public Task<List<DeliveryOrder>> GetAll()
        {
            return ctx.DeliveryOffer.ToListAsync();
        }

        public async Task<DeliveryOrder> GetById(int id)
        {
            return await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<DeliveryOrder> Update(DeliveryOrder entity)
        {
            var existingDeliveryOrder = await ctx.DeliveryOffer.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingDeliveryOrder == null)
                return null;
            existingDeliveryOrder.Id = entity.Id;
            existingDeliveryOrder.DeliveryId = entity.DeliveryId;
            existingDeliveryOrder.Delivery = entity.Delivery;
            existingDeliveryOrder.OrderId = entity.OrderId;
            existingDeliveryOrder.Order = entity.Order;
            existingDeliveryOrder.StopIndex = entity.StopIndex;
            existingDeliveryOrder.DistanceFromPreviousStop = entity.DistanceFromPreviousStop;
            existingDeliveryOrder.DeliveredTime = entity.DeliveredTime; 
            existingDeliveryOrder.Status = entity.Status;
            await ctx.Save();
            return existingDeliveryOrder;
        }
    }
}
