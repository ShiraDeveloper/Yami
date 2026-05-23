using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using System.Text.RegularExpressions;

namespace Common.Hubs
{
    public class TrackingHub : Hub
    {
        public async Task JoinOrderGroup(string orderId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, orderId);
        }

        public async Task LeaveOrderGroup(string orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, orderId);
        }

        /// <summary>
        /// מופעל בעת התחברות - מזהה את המשתמש ומצרף אותו לקבוצה אישית לקבלת הצעות (Waves).
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            Console.WriteLine("HUB CONNECTED");
            // חילוץ ה-ID מתוך ה-Token עם כיסוי מלא לכל סוגי ה-Claims הנפוצים (id, sub, NameIdentifier)
            var userId = Context.User?.FindFirst("id")?.Value
                         ?? Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst("sub")?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                string groupName = $"user-{userId}";
                await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
                Console.WriteLine($"[SignalR] User {userId} connected and joined group {groupName}");
            }
            else
            {
                // הודעה זו לא אמורה להופיע יותר בזכות ה-[Authorize]
                Console.WriteLine("[SignalR] Warning: User ID not found in Token despite Authorization.");
            }

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// הצטרפות לקבוצת מעקב של הזמנה ספציפית (עבור הלקוח או החנות).
        /// </summary>
        public async Task JoinOrder(int orderId)
        {
            try
            {
                Console.WriteLine("==========");
                Console.WriteLine("JOIN ORDER CALLED");
                Console.WriteLine($"ORDER ID: {orderId}");
                Console.WriteLine($"CONNECTION ID: {Context.ConnectionId}");

                if (orderId <= 0)
                {
                    throw new Exception("INVALID ORDER ID");
                }

                string groupName = $"order-{orderId}";

                Console.WriteLine($"GROUP: {groupName}");

                await Groups.AddToGroupAsync(
                    Context.ConnectionId,
                    groupName
                );

                Console.WriteLine("JOIN SUCCESS");
                Console.WriteLine("==========");
            }
            catch (Exception ex)
            {
                Console.WriteLine("JOIN ERROR:");
                Console.WriteLine(ex.Message);

                throw;
            }
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

        public async Task JoinCourierGroup(int userId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user-{userId}");
        }

        /// <summary>
        /// הצטרפות לקבוצת עריכת רכבים לשעות ספציפיות (עבור צפייה בזמן אמת בשינויי סטטוס)
        /// </summary>
        public async Task JoinCarSelectionGroup(string timeSlotKey)
        {
            // timeSlotKey צורה: "2024-05-19_09-18" (תאריך_שעות התחלה-סיום)
            await Groups.AddToGroupAsync(Context.ConnectionId, $"cars-{timeSlotKey}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} joined car group: cars-{timeSlotKey}");
        }

        /// <summary>
        /// עזיבת קבוצת עריכת רכבים
        /// </summary>
        public async Task LeaveCarSelectionGroup(string timeSlotKey)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"cars-{timeSlotKey}");
            Console.WriteLine($"[SignalR] Connection {Context.ConnectionId} left car group: cars-{timeSlotKey}");
        }

        /// <summary>
        /// הפצת עדכון סטטוס רכב לכל המשתמשים הצופים בשעות זהות
        /// זה נקרא מהשרות/קונטרולר כשמישהו מזמין או מבטל הזמנה
        /// </summary>
        public async Task BroadcastCarStatusUpdate(int carId, string status, string timeSlotKey)
        {
            await Clients.Group($"cars-{timeSlotKey}")
                .SendAsync("CarStatusUpdated", new
                {
                    carId,
                    status, // "Available", "Partially Available", "Occupied"
                    timestamp = DateTime.UtcNow
                });
        }

    }
}

