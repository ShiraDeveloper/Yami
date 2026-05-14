using Repository.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Repository.Interfaces
{
    // הממשק הזה יורש את הפעולות הכלליות ומוסיף את הפעולה הספציפית ל-Yami
    public interface IOrderRepository : IRepository<Order>
    {
        Task<List<Order>> GetOrdersByCourierWithDetailsAsync(int courierId);
        Task<List<Order>> GetByCustomerIdAsync(int customerId);
    }
}