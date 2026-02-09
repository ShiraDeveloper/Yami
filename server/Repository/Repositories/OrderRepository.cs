using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Repository.Entities;
using Microsoft.EntityFrameworkCore;


namespace Repository.Repositories
{
    internal class OrderRepository : IRepository<Orders>
    {
        private readonly IContext ctx;
        public OrderRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<Orders> Add(Orders orders)
        {
            ctx.Orders.Add(orders);
            await ctx.Save();
            return orders;
        }

        public async Task<Orders> Delete(int id)
        {
            var o = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == id);
            if (o != null)
            {
                ctx.Orders.Remove(o);
                await ctx.Save();
                return o;
            }
            return null;
        }

        public Task<List<Orders>> GetAll()
        {
            return ctx.Orders.ToListAsync();
        }

        public async Task<Orders> GetById(int id)
        {
            return await ctx.Orders.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Orders> Update(int id,Orders orders)
        {
            var o = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == id);
            o.CustomerId = orders.CustomerId;
            o.StoreId = orders.StoreId;
            o.CourierId = orders.CourierId;
            o.Status = orders.Status;
            o.CreatedAt = orders.CreatedAt;
            o.ExpectedDeliveryTime = orders.ExpectedDeliveryTime;
            await ctx.Save();
            return o;
        }

        public async Task<Orders> Update(Orders orders)
        {
            var existingOrder = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == orders.Id);
            if (existingOrder == null)
                return null; 
            existingOrder.CustomerId = orders.CustomerId;
            existingOrder.StoreId = orders.StoreId;
            existingOrder.CourierId = orders.CourierId;
            existingOrder.Status = orders.Status;
            existingOrder.CreatedAt = orders.CreatedAt;
            existingOrder.ExpectedDeliveryTime = orders.ExpectedDeliveryTime;
            await ctx.Save();
            return existingOrder;
        }
    }
}
