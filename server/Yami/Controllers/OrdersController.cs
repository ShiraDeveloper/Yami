using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Service.Interfaces;
using Repository.Entities;
using Common.Dto;
using System.Security.Claims;

namespace Yami.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        private readonly ILogger<OrdersController> _logger;

        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
        {
            _orderService = orderService;
            _logger = logger;
        }

        // 1. יצירת הזמנה חדשה
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        {
            try
            {
                // שליפה ישירה מה-Claims של המשתמש המחובר
                var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");

                if (claim == null)
                {
                    return Unauthorized("מזהה משתמש חסר בטוקן - נא להתחבר מחדש");
                }

                int userId = int.Parse(claim.Value);

                var order = await _orderService.CreateOrder(userId, dto);

                if (order == null) return BadRequest("לא ניתן היה ליצור את ההזמנה");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, $"שגיאת שרת: {ex.Message}");
            }
        }

        // 2. אישור הזמנה (Accept)
        [HttpPost("accept/{orderId}")]
        public async Task<IActionResult> AcceptOrder(int orderId)
        {
            try
            {
                int courierId = await GetCourierId();
                var order = await _orderService.AssignCourier(orderId, courierId);
                return Ok(new { message = "Order accepted successfully", order });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 3. דחיית הזמנה (Reject)
        [HttpPost("reject/{orderId}")]
        public async Task<IActionResult> RejectOrder(int orderId)
        {
            try
            {
                int courierId = await GetCourierId();
                _orderService.RegisterRejection(orderId, courierId);
                return Ok(new { message = "Rejection registered" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // 4. שליפת מסלול השליח
        [HttpGet("my-route")]
        public async Task<IActionResult> GetMyRoute()
        {
            try
            {
                int userId = GetUserId();
                int courierId = await _orderService.GetCourierIdByUserId(userId);

                if (courierId == 0)
                {
                    return Ok(new List<Order>());
                }

                var orders = await _orderService.GetOrdersByCourier(courierId);
                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting route");
                return StatusCode(500, "Internal error");
            }
        }

        // 5. עדכון סטטוס
        [HttpPost("complete-task/{orderId}")]
        public async Task<IActionResult> CompleteTask(int orderId, [FromBody] StatusUpdateDto dto)
        {
            try
            {
                var userId = GetUserId();
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                var order = await _orderService.UpdateStatus(orderId, dto.Status, userId, role);
                return Ok(order);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // --- פונקציות עזר פרטיות ---

        private int GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(claim)) throw new Exception("User ID not found in token");
            return int.Parse(claim);
        }

        private async Task<int> GetCourierId()
        {
            var courierIdClaim = User.FindFirst("CourierId")?.Value;
            if (!string.IsNullOrEmpty(courierIdClaim)) return int.Parse(courierIdClaim);

            var userId = GetUserId();
            var courierId = await _orderService.GetCourierIdByUserId(userId);

            if (courierId == 0) throw new Exception("משתמש אינו מזוהה כשליח במערכת");
            return courierId;
        }
        // בתוך OrdersController.cs
        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (claim == null) return Unauthorized();

                int userId = int.Parse(claim.Value);

                // תיקון: קריאה למתודה שמחזירה את רשימת ההזמנות של המשתמש
                var orders = await _orderService.GetOrdersByUserId(userId);

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user orders");
                return StatusCode(500, "Internal server error");
            }
        }
    }
    public class StatusUpdateDto
    {
        public OrderStatus Status { get; set; }
    }
}