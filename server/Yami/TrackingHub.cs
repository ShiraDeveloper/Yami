using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System;
using System.Threading.Tasks;

namespace Common.Hubs
{
    public class TrackingHub : Hub
    {
        /// <summary>
        /// מופעל ברגע שהשליח מתחבר.
        /// מצרף את השליח לקבוצה אישית על בסיס ה-UserId שלו.
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            // ניסיון שליפת ה-ID מה-Token בשתי דרכים (סטנדרטית ומותאמת אישית)
            var userId1 = Context.UserIdentifier;
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("id")?.Value;
            
            if (!string.IsNullOrEmpty(userId))
            {
                // שימוש בפורמט "user-{id}" כדי לסנכרן עם ה-OrderService
                string groupName = $"user-{userId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

                Console.WriteLine($"[SignalR] Connection Established: User {userId} joined group {groupName}");
            }
            else
            {
                Console.WriteLine("[SignalR] Warning: Connection established without a valid User ID Claim.");
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// הצטרפות לקבוצת מעקב של הזמנה ספציפית (עבור עדכוני מיקום חיים).
        /// </summary>
        public async Task JoinOrder(int orderId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"order-{orderId}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} joined order group: order-{orderId}");
        }

        /// <summary>
        /// עזיבת קבוצת מעקב של הזמנה.
        /// </summary>
        public async Task LeaveOrder(int orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order-{orderId}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} left order group: order-{orderId}");
        }

        /// <summary>
        /// עדכון מיקום השליח ושליחתו לכל מי שמאזין להזמנה הספציפית (לקוחות/מוקד).
        /// </summary>
        public async Task UpdateCourierLocation(int courierId, int orderId, double lat, double lng)
        {
            // שליחה לכל חברי קבוצת ההזמנה
            await Clients.Group($"order-{orderId}")
                .SendAsync("ReceiveCourierLocation", new { courierId, lat, lng, timestamp = DateTime.UtcNow });
        }

        /// <summary>
        /// מופעל בעת ניתוק - SignalR מנקה קבוצות אוטומטית, אך ניתן להוסיף לוגיקה כאן.
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} disconnected.");
            await base.OnDisconnectedAsync(exception);
        }
    }
}