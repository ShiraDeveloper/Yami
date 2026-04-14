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
    public class OrderRepository : IRepository<Order>
    {
        private readonly IContext ctx;
        public OrderRepository(IContext context)
        {
            ctx = context;
        }
        public async Task<Order> Add(Order orders)
        {
            ctx.Orders.Add(orders);
            await ctx.Save();
            // 🔥 זה מה שהיה חסר
            await ctx.SaveChangesAsync();

            return orders;
        }

        public async Task<Order> Delete(int id)
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

        public Task<List<Order>> GetAll()
        {
            return ctx.Orders.ToListAsync();
        }

        public async Task<Order> GetById(int id)
        {
            return await ctx.Orders.FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task<Order> Update(int id,Order orders)
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

        public async Task<Order> Update(Order orders)
        {
            var existingOrder = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == orders.Id);
            if (existingOrder == null)
                return null; 
            existingOrder.Id = orders.Id;
            existingOrder.CustomerId = orders.CustomerId;
            existingOrder.Customer = orders.Customer;
            existingOrder.StoreId = orders.StoreId;
            existingOrder.Store = orders.Store;
            existingOrder.CourierId = orders.CourierId;
            existingOrder.Courier = orders.Courier;
            existingOrder.Status = orders.Status;
            existingOrder.CreatedAt = orders.CreatedAt;
            existingOrder.ExpectedDeliveryTime = orders.ExpectedDeliveryTime;
            existingOrder.DeliveredAt = orders.DeliveredAt;
            existingOrder.DeliveryLatitude = orders.DeliveryLatitude;
            existingOrder.DeliveryLongitude = orders.DeliveryLongitude;
            existingOrder.TotalVolume = orders.TotalVolume;
            existingOrder.OrderItems = orders.OrderItems;
            await ctx.Save();
            return existingOrder;
        }
    }
}
