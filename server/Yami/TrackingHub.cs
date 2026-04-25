using Microsoft.AspNetCore.SignalR;
using System;
using System.Threading.Tasks;

public class TrackingHub : Hub
{
    // המשתמש (הלקוח) מצטרף לקבוצה של הזמנה ספציפית כדי לקבל עדכונים רק עליה
    public async Task JoinOrder(int orderId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
        Console.WriteLine($"[SignalR] Client {Context.ConnectionId} joined group: order-{orderId}");
    }

    // יציאה מהקבוצה (חשוב למניעת כפילויות כשעוברים בין דפים)
    public async Task LeaveOrder(int orderId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderId}");
        Console.WriteLine($"[SignalR] Client {Context.ConnectionId} left group: order-{orderId}");
    }

    // השליח קורא לפונקציה הזו כדי לעדכן את מיקומו
    public async Task UpdateCourierLocation(int orderId, double lat, double lng)
    {
        // שליחת המיקום לכל מי שנמצא בקבוצה של ההזמנה הזו
        // שימי לב: שם הפונקציה ב-React חייב להיות "ReceiveCourierLocation"
        await Clients.Group($"order-{orderId}")
            .SendAsync("ReceiveCourierLocation", orderId, lat, lng);
    }
}