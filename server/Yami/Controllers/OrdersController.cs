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
        private readonly IStoreService _storeService;

        public OrdersController(IOrderService orderService, ILogger<OrdersController> logger, IStoreService storeService)
        {
            _orderService = orderService;
            _logger = logger;
            _storeService = storeService;
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto dto)
        {
            try
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");

                if (claim == null)
                {
                    return Unauthorized("User ID missing from token - please reconnect");
                }

                int userId = int.Parse(claim.Value);
                var store = await _storeService.GetById(dto.StoreId); 

                if (store == null)
                {
                    return NotFound("The requested store does not exist in the system.");
                }

                if (!store.IsOpen) 
                {
                    return BadRequest("The purchase cannot be made. The store is currently closed!");
                }

                var order = await _orderService.CreateOrder(userId, dto);

                if (order == null) return BadRequest("The order could not be created.");

                return Ok(order);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating order");
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }

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

        // --- Private helper functions ---

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

            if (courierId == 0) throw new Exception("User is not recognized as a courier in the system");
            return courierId;
        }

        [HttpGet("my-orders")]
        [Authorize]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var claim = User.FindFirst(ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
                if (claim == null) return Unauthorized();

                int userId = int.Parse(claim.Value);

                var orders = await _orderService.GetOrdersByUserId(userId);

                return Ok(orders);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user orders");
                return StatusCode(500, "Internal server error");
            }
        }
        [HttpGet("route")]
        public async Task<IActionResult> GetRoute()
        {
            try
            {
                int userId = GetUserId();

                int courierId =
                    await _orderService.GetCourierIdByUserId(userId);

                var route =
                    await _orderService.GetCourierRoute(courierId);

                return Ok(route);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting courier route");

                return StatusCode(500, ex.Message);
            }
        }
        // 6. שליפת הצעה ממתינה עבור שליח - חלוקה נקייה לשכבות
        //[Authorize]
        //[HttpGet("check-offers")]
        //public async Task<IActionResult> CheckForOffers()
        //{
        //    try
        //    {
        //        int userId = GetUserId();
        //        int courierId = await _orderService.GetCourierIdByUserId(userId);

        //        if (courierId == 0) return NotFound("המשתמש אינו שליח במערכת");

        //        // קריאה לשכבת השירות (Service) במקום פנייה ישירה ל-DB
        //        var offer = await _orderService.GetPendingOfferForCourier(courierId);

        //        return Ok(new { offer });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error checking offers for courier");
        //        return StatusCode(500, "שגיאת שרת פנימית בקבלת הצעות");
        //    }
        //}


    }
    public class StatusUpdateDto
    {
        public OrderStatus Status { get; set; }
    }
}