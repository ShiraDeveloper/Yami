using Common.Dto;
using Repository.Entities;

namespace Service.Interfaces
{
    public interface IOrderService
    {
        // יצירת הזמנה
        Task<Order?> CreateOrder(int customerId, OrderCreateDto dto);

        // ניהול תור שליחים - פונקציה קריטית שהייתה חסרה בממשק שלך
        Task<bool> DispatchOrderSequential(int orderId);

        // שליפת נתונים
        Task<Order?> GetById(int id);
        Task<List<Order>> GetAll();
        Task<List<Order>> GetOrdersByCourier(int courierId);

        // עדכון סטטוס ושיבוץ
        Task<Order> UpdateStatus(int id, OrderStatus status, int userId, string role);
        Task<Order> AssignCourier(int orderId, int courierId);
        void RegisterRejection(int orderId, int courierId);
        // הוסיפי זאת בתוך ה-interface IOrderService
        Task<int> GetCourierIdByUserId(int userId);
        Task<List<Order>> GetOrdersByUserId(int userId);
        // הערה: הסרנו את RejectAndReassign כי הלוגיקה שלו הוטמעה בתוך DispatchOrderSequential
    }
}