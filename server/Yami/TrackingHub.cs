using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System;
using System.Threading.Tasks;

namespace Common.Hubs
{
    public class TrackingHub : Hub
    {
        /// <summary>
        /// מופעל בעת התחברות - מזהה את המשתמש ומצרף אותו לקבוצה אישית לקבלת הצעות (Waves).
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            // חילוץ מזהה המשתמש מה-Token בדרכים שונות להבטחת תאימות
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("id")?.Value
                         ?? Context.UserIdentifier;

            if (!string.IsNullOrEmpty(userId))
            {
                // יצירת קבוצה ייחודית: user-{id}
                // שם הקבוצה חייב להתאים למה שמוגדר ב-OrderService
                string groupName = $"user-{userId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                Console.WriteLine($"[SignalR] Connection Established: User {userId} joined group {groupName}");
            }
            else
            {
                // אם המשתמש לא מזוהה, הוא לא יוכל לקבל הצעות אישיות
                Console.WriteLine("[SignalR] Warning: Connection established without a valid User ID Claim.");
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// הצטרפות לקבוצת מעקב של הזמנה ספציפית (עבור הלקוח או החנות).
        /// </summary>
        public async Task JoinOrder(int orderId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} joined tracking group: order-{orderId}");
        }

        /// <summary>
        /// עזיבת קבוצת מעקב של הזמנה.
        /// </summary>
        public async Task LeaveOrder(int orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderId}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} left tracking group: order-{orderId}");
        }

        /// <summary>
        /// הפצת מיקום השליח בזמן אמת לכל מי שמאזין להזמנה הספציפית.
        /// </summary>
        public async Task UpdateCourierLocation(int courierId, int orderId, double lat, double lng)
        {
            // שליחה לכל חברי קבוצת ה-order (לקוחות ומנהלים)
            await Clients.Group($"order-{orderId}")
                .SendAsync("ReceiveCourierLocation", new
                {
                    courierId,
                    lat,
                    lng,
                    timestamp = DateTime.UtcNow
                });
        }

        /// <summary>
        /// ניקוי בעת ניתוק.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} disconnected.");
            await base.OnDisconnectedAsync(exception);
        }
    }
}