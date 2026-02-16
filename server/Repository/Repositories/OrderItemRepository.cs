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
    internal class OrderItemRepository : IRepository<OrderItem>
    {
        private readonly IContext ctx;
        public OrderItemRepository(IContext context)
        {
            this.ctx= context;
        }
        public async Task<OrderItem> Add(OrderItem entity)
        {
            ctx.OrderItem.Add(entity);
            await ctx.Save();
            return entity;
        }

        public async Task<OrderItem> Delete(int id)
        {
            var o = await ctx.OrderItem.FirstOrDefaultAsync(x => x.Id == id);
            if (o != null)
            {
                ctx.OrderItem.Remove(o);
                await ctx.Save();
                return o;
            }
            return null;

        }

        public Task<List<OrderItem>> GetAll()
        {
            return ctx.OrderItem.ToListAsync();
        }

        public async Task<OrderItem> GetById(int id)
        {
            return await ctx.OrderItem.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<OrderItem> Update(OrderItem entity)
        {
            var existingOrderItem = await ctx.OrderItem.FirstOrDefaultAsync(x => x.Id == entity.Id);
            if (existingOrderItem == null)
                return null;
            existingOrderItem.OrderId = entity.OrderId;
            existingOrderItem.Quantity = entity.Quantity;
            existingOrderItem.Id = entity.Id;
            existingOrderItem.OrderId = entity.OrderId;
            existingOrderItem.MenuItemId = entity.MenuItemId;
            existingOrderItem.Order = entity.Order;
            existingOrderItem.Menu = entity.Menu;
            await ctx.Save();
            return existingOrderItem;
        }
    }
}
