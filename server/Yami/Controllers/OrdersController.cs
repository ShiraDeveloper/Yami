using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Service.Interfaces;
using Common.Dto;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Common.Hubs;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ICourierMatchingService _matchingService;
        private readonly ICourierRepository _courierRepository; // הוספת רפוזיטורי כדי למצוא את ה-UserId
        private readonly IHubContext<TrackingHub> _hubContext;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(
                IOrderService orderService,
                ICourierMatchingService matchingService,
                ICourierRepository courierRepository,
                IHubContext<TrackingHub> hubContext,
                ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _matchingService = matchingService;
            _courierRepository = courierRepository;
            _hubContext = hubContext;
            _logger = logger;
        }

        // ================= יצירת הזמנה =================

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            try
            {
                // 1. חילוץ מזהה המשתמש מהטוקן
                var userIdClaim = User.FindFirst("id")?.Value;
                if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
                int userId = int.Parse(userIdClaim);

                // 2. יצירת ההזמנה בבסיס הנתונים
                var createdOrder = await _orderService.CreateOrder(userId, dto);

                // 3. מציאת השליח המתאים ביותר
                var bestCourierId = await _matchingService.FindBestCourier(dto.DeliveryLatitude, dto.DeliveryLongitude);

                // 4. שליחת הודעה לשליח (אם נמצא)
                if (bestCourierId.HasValue)
                {
                    // תיקון קריטי: שליפת ישות השליח כדי להשיג את ה-UserId שלו לצורך SignalR
                    var courier = await _courierRepository.GetById(bestCourierId.Value);

                    if (courier != null)
                    {
                        // שליחה לקבוצה user-{UserId} כפי שמוגדר ב-TrackingHub
                        await _hubContext.Clients.Group($"user-{courier.UserId}")
                            .SendAsync("NewOrderAssigned", new
                            {
                                orderId = createdOrder.Id,
                                address = createdOrder.Address,
                                restaurantName = createdOrder.Store?.Name // הוספת שם החנות אם קיים
                            });
                    }
                }

                return Ok(new
                {
                    Message = "Order created successfully",
                    OrderId = createdOrder.Id,
                    CourierAssigned = bestCourierId != null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        // ================= הזמנות שלי (לקוח) =================

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                int userId = GetCurrentUserId();
                var orders = await _orderService.GetAll();

                if (orders == null) return Ok(new List<OrderDto>());

                var result = orders
                    .Where(o => o.CustomerId == userId)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        StoreId = o.StoreId,
                        Status = o.Status.ToString(),
                        OrderItems = o.OrderItems?.Select(i => new OrderItemDto
                        {
                            MenuId = i.MenuId,
                            Quantity = i.Quantity
                        }).ToList() ?? new List<OrderItemDto>()
                    })
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching your orders.");
            }
        }

        // ================= ניהול (Admin) =================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orders = await _orderService.GetAll();
                var result = orders.Select(o => new OrderDto
                {
                    Id = o.Id,
                    StoreId = o.StoreId,
                    Status = o.Status.ToString(),
                    Address = o.Address
                });
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= פעולות שליח =================

        [HttpPost("accept/{orderId}")]
        [Authorize(Roles = "Delivery")]
        public async Task<IActionResult> AcceptOrder(int orderId)
        {
            try
            {
                var userId = GetCurrentUserId();
                // מציאת ה-CourierId לפי ה-UserId מהטוקן
                var courier = (await _courierRepository.GetAll()).FirstOrDefault(c => c.UserId == userId);
                if (courier == null) return NotFound("Courier profile not found");

                await _orderService.AssignCourier(orderId, courier.Id);
                return Ok(new { Message = "Order accepted and assigned" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("reject/{orderId}")]
        [Authorize(Roles = "Delivery")]
        public async Task<IActionResult> RejectOrder(int orderId)
        {
            // במודל הטורי, השליח פשוט מוותר והלולאה בשירות תמשיך לשליח הבא
            return Ok(new { Message = "Order rejected by courier" });
        }

        [HttpGet("my-route")]
        [Authorize(Roles = "Delivery")]
        public async Task<IActionResult> GetMyRoute()
        {
            try
            {
                var userId = GetCurrentUserId();
                var courier = (await _courierRepository.GetAll()).FirstOrDefault(c => c.UserId == userId);
                if (courier == null) return NotFound();

                var orders = await _orderService.GetOrdersByCourier(courier.Id);

                var sortedOrders = orders
                    .Where(o => o.Status != OrderStatus.Delivered)
                    .OrderBy(o => o.PlannedSequence)
                .Select(o => new OrderDto
                {
                    Id = o.Id,
                    Status = o.Status.ToString(),
                    // הוספת לוגיקה פשוטה בשרת שתגיד ל-React מה סוג המשימה
                    Type = o.Status == OrderStatus.Approved ? "pickup" : "delivery",
                    Address = o.Address,
                    DeliveryLatitude = o.DeliveryLatitude,
                    DeliveryLongitude = o.DeliveryLongitude
                }).ToList();

                return Ok(sortedOrders);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= עזרי עזר =================

        [NonAction]
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst("id");
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new UnauthorizedAccessException("User ID missing or invalid in token");
            }
            return userId;
        }
        [HttpPost("complete-task/{orderId}")]
        [Authorize(Roles = "Delivery")]
        public async Task<IActionResult> CompleteTask(int orderId, [FromBody] TaskUpdateDto model)
        {
            // 1. בדיקת תקינות הקלט - מונע שגיאות פענוח JSON מצד השרת
            if (model == null || string.IsNullOrWhiteSpace(model.Type))
            {
                return BadRequest(new { message = "Task type (pickup/delivery) is missing or invalid" });
            }

            try
            {
                // 2. חילוץ פרטי המשתמש מהטוקן
                int userId = GetCurrentUserId();
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value
                            ?? User.FindFirst("role")?.Value
                            ?? "Delivery";

                // 3. תרגום סוג המשימה לסטטוס (כולל טיפול ב-Case Sensitivity)
                OrderStatus newStatus;
                string taskType = model.Type.ToLower();

                if (taskType == "pickup")
                {
                    newStatus = OrderStatus.InProgress;
                }
                else if (taskType == "delivery")
                {
                    newStatus = OrderStatus.Delivered;
                }
                else
                {
                    return BadRequest(new { message = "Invalid task type. Use 'pickup' or 'delivery'." });
                }

                // 4. עדכון הסטטוס בשירות הליבה
                // הערה: אנחנו לא מחזירים את 'result' ישירות כדי למנוע שגיאות Cycle ב-JSON
                await _orderService.UpdateStatus(orderId, newStatus, userId, userRole);

                // 5. החזרת תשובה מובנית וקצרה
                return Ok(new
                {
                    message = "Task updated successfully",
                    orderId = orderId,
                    newStatus = newStatus.ToString(),
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                // רישום השגיאה המלאה בשרת לצורך תחזוקה
                _logger.LogError(ex, "Error in CompleteTask for Order {OrderId}", orderId);

                // החזרת שגיאה בפורמט JSON תקין ללקוח
                return StatusCode(500, new
                {
                    message = "An internal error occurred",
                    details = ex.Message
                });
            }
        }
    }
}