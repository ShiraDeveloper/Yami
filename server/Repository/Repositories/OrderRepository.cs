using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Repository.Entities;
using Microsoft.EntityFrameworkCore;

namespace Repository.Repositories
{
    public class OrderRepository : IRepository<Order>, IOrderRepository // הוספת הממשק הייעודי
    {
        private readonly IContext ctx;
        public OrderRepository(IContext context)
        {
            ctx = context;
        }

        // --- מתודה חדשה לפתרון שגיאות ה-500 ב-Dashboard ---
        public async Task<List<Order>> GetOrdersByCourierWithDetailsAsync(int courierId)
        {
            return await ctx.Orders
                .Include(o => o.Store)      // טעינת נתוני החנות (מונע NULL ב-Frontend)
                .Include(o => o.Customer)   // טעינת נתוני הלקוח (מונע NULL ב-Frontend)
                .Where(o => o.CourierId == courierId && o.Status != OrderStatus.Delivered)
                .OrderBy(o => o.CreatedAt)  // סידור לפי זמן יצירה
                .ToListAsync();
        }

        public async Task<Order> Add(Order orders)
        {
            ctx.Orders.Add(orders);
            await ctx.Save(); // שימוש במתודת ה-Save הקיימת שלך
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

        public async Task<List<Order>> GetAll()
        {
            return await ctx.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Store)    // מומלץ להוסיף גם כאן
                .Include(o => o.Customer) // מומלץ להוסיף גם כאן
                .ToListAsync();
        }

        public async Task<Order?> GetById(int id)
        {
            return await ctx.Orders
                .Include(o => o.Store)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Menu) // אם תרצה להציג את שם המנה ולא רק ID
                .AsNoTracking() // משפר ביצועים כי אנחנו רק קוראים נתונים, לא עורכים אותם
                .FirstOrDefaultAsync(x => x.Id == id);
        }
        // בתוך OrderRepository.cs
        // בתוך OrderRepository.cs
        public async Task<List<Order>> GetByCustomerIdAsync(int customerId)
        {
            return await ctx.Orders
                .Include(o => o.Store) // חשוב כדי לראות את שם החנות
                .Include(o => o.OrderItems) // חשוב כדי לראות את הפריטים
                .Where(o => o.CustomerId == customerId)
                .OrderByDescending(o => o.CreatedAt) // הצגת ההזמנה הכי חדשה ראשונה
                .ToListAsync();
        }
        public async Task<Order> Update(Order orders)
        {
            var existingOrder = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == orders.Id);
            if (existingOrder == null) return null;

            // עדכון שדות קריטיים
            existingOrder.Status = orders.Status;
            existingOrder.CourierId = orders.CourierId;
            existingOrder.DeliveredAt = orders.DeliveredAt;
            existingOrder.ExpectedDeliveryTime = orders.ExpectedDeliveryTime;

            // ב-Entity Framework, עדיף לעדכן שדות ספציפיים ולא להחליף אובייקטים שלמים (כמו Store או Customer) 
            // אלא אם כן הם השתנו במפורש.

            await ctx.Save();
            return existingOrder;
        }

        // מתודת ה-Update הישנה עם ה-ID נשארה לטובת הממשק הכללי
        public async Task<Order> Update(int id, Order orders)
        {
            var o = await ctx.Orders.FirstOrDefaultAsync(x => x.Id == id);
            if (o == null) return null;

            o.Status = orders.Status;
            o.CourierId = orders.CourierId;
            await ctx.Save();
            return o;
        }
    }
}