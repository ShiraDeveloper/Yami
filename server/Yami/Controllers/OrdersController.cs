using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Service.Interfaces;
using Common.Dto;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        // ================= יצירת הזמנה =================

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("id")!.Value);

                var order = await _orderService.CreateOrder(userId, dto);

                if (order == null)
                    return BadRequest("No available courier found");

                var result = new OrderDto
                {
                    Id = order.Id,
                    StoreId = order.StoreId,
                    Status = order.Status.ToString(),
                    OrderItems = order.OrderItems?.Select(i => new OrderItemDto
                    {
                        MenuId = i.MenuId,
                        Quantity = i.Quantity
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= הזמנות שלי =================

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                // 1. חילוץ ה-ID מהטוקן בצורה בטוחה
                var userIdClaim = User.FindFirst("id");
                if (userIdClaim == null) return Unauthorized("User ID not found in token");

                int userId = int.Parse(userIdClaim.Value);

                // 2. שליפת הנתונים מהשרות (וודאי שהשרות משתמש ב-Include!)
                var orders = await _orderService.GetAll();

                if (orders == null) return Ok(new List<OrderDto>());

                // 3. מיפוי ל-DTO עם הגנות NULL
                var result = orders
                    .Where(o => o.CustomerId == userId)
                    .Select(o => new OrderDto
                    {
                        Id = o.Id,
                        StoreId = o.StoreId,
                        Status = o.Status.ToString(),

                        // הגנה כפולה: גם אם שכחנו Include, הקוד לא יקרוס
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
                // רישום השגיאה ב-Console של השרת לדיבאג עתידי
                Console.WriteLine($"Error fetching orders for user: {ex.Message}");
                return StatusCode(500, "An error occurred while fetching your orders.");
            }
        }
        // ================= כל ההזמנות =================

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
                    OrderItems = o.OrderItems.Select(i => new OrderItemDto
                    {
                        MenuId = i.MenuId,
                        Quantity = i.Quantity
                    }).ToList()
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= שליח לוקח =================

        [HttpPut("{orderId}/assign")]
        [Authorize(Roles = "Delivery")]
        public async Task<IActionResult> AssignToMe(int orderId)
        {
            try
            {
                var courierId = int.Parse(User.FindFirst("id")!.Value);

                var order = await _orderService.AssignCourier(orderId, courierId);

                return Ok(new OrderDto
                {
                    Id = order.Id,
                    StoreId = order.StoreId,
                    Status = order.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= דחייה =================

        [HttpPut("{orderId}/reject")]
        [Authorize(Roles = "Courier")]
        public async Task<IActionResult> Reject(int orderId)
        {
            try
            {
                var courierId = int.Parse(User.FindFirst("id")!.Value);

                var order = await _orderService.RejectAndReassign(orderId, courierId);

                return Ok(new OrderDto
                {
                    Id = order.Id,
                    StoreId = order.StoreId,
                    Status = order.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= עדכון סטטוס =================

        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] OrderStatus status)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("id")!.Value);
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                var order = await _orderService.UpdateStatus(orderId, status, userId, role);

                return Ok(new OrderDto
                {
                    Id = order.Id,
                    StoreId = order.StoreId,
                    Status = order.Status.ToString()
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        // ================= מסלול השליח =================
        [HttpGet("my-route")]
        public async Task<IActionResult> GetMyRoute()
        {
            var courierId = GetCurrentUserId(); // שליפת ה-ID של השליח המחובר
            var orders = await _orderService.GetOrdersByCourier(courierId);

            // כאן נחזיר את ההזמנות ממוינות לפי הלוגיקה שבנינו ב-CanCourierHandleRouteWithinTime
            var sortedOrders = orders
                .Where(o => o.Status != OrderStatus.Delivered)
                .OrderBy(o => o.PlannedSequence) // כדאי להוסיף שדה סדר ב-DB
                .ToList();

            return Ok(sortedOrders);
        }
        [NonAction] // מציין שזו לא נקודת קצה של ה-API אלא פונקציה פנימית
        private int GetCurrentUserId()
        {
            // שליפת ה-ID מתוך ה-Claims של ה-Token
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);

            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            {
                throw new Exception("משתמש לא מחובר או Token לא תקין");
            }

            return userId;
        }
    }
}