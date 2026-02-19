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
    internal class DeliveryOrderRepository : IRepository<DeliveryOrder>
    {
        private readonly IContext ctx;
        public DeliveryOrderRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<DeliveryOrder> Add(DeliveryOrder entity)
        {
            ctx.DeliveryOrder.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<DeliveryOrder> Delete(int id)
        {
            var d = await ctx.DeliveryOrder.FirstOrDefaultAsync(x => x.Id == id);
            if (d != null)
            {
                ctx.DeliveryOrder.Remove(d);
                await ctx.Save();
                return d;
            }
            return null;
        }

        public Task<List<DeliveryOrder>> GetAll()
        {
            return ctx.DeliveryOrder.ToListAsync();
        }

        public async Task<DeliveryOrder> GetById(int id)
        {
            return await ctx.DeliveryOrder.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<DeliveryOrder> Update(DeliveryOrder entity)
        {
            var existingDeliveryOrder = await ctx.DeliveryOrder.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingDeliveryOrder == null)
                return null;
            existingDeliveryOrder.Id = entity.Id;
            existingDeliveryOrder.DeliveryId = entity.DeliveryId;
            existingDeliveryOrder.OrderId = entity.OrderId;
            existingDeliveryOrder.IsOffered = entity.IsOffered;
            existingDeliveryOrder.RefusedBy = entity.RefusedBy;
            existingDeliveryOrder.DistanceFromPreviousStop = entity.DistanceFromPreviousStop;
            existingDeliveryOrder.DropOrderIndex = entity.DropOrderIndex;
            existingDeliveryOrder.Status = entity.Status;
            existingDeliveryOrder.DeliveredTime = entity.DeliveredTime; 
            existingDeliveryOrder.Delivery = entity.Delivery;
            existingDeliveryOrder.Order = entity.Order;
            existingDeliveryOrder.DropOrderIndex = entity.DropOrderIndex;
            await ctx.Save();
            return existingDeliveryOrder;
        }
    }
}
