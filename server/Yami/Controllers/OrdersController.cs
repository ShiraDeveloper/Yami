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

        // ================= 1. יצירת הזמנה =================

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("id")!.Value);

                var result = await _orderService.CreateOrder(userId, dto);

                if (result == null)
                    return BadRequest("No available courier found");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= 2. הזמנות של המשתמש =================

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            try
            {
                var userId = int.Parse(User.FindFirst("id")!.Value);

                var orders = await _orderService.GetAll();

                var userOrders = orders.Where(o => o.CustomerId == userId);

                return Ok(userOrders);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= 3. כל ההזמנות =================

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var orders = await _orderService.GetAll();
                return Ok(orders);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= 4. שליח לוקח הזמנה =================

        [HttpPut("{orderId}/assign")]
        [Authorize(Roles = "Courier")]
        public async Task<IActionResult> AssignToMe(int orderId)
        {
            try
            {
                var courierId = int.Parse(User.FindFirst("id")!.Value);

                var result = await _orderService.AssignCourier(orderId, courierId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= 5. שליח דוחה הזמנה (Reject + Reassign) =================

        [HttpPut("{orderId}/reject")]
        [Authorize(Roles = "Courier")]
        public async Task<IActionResult> Reject(int orderId)
        {
            try
            {
                var courierId = int.Parse(User.FindFirst("id")!.Value);

                var result = await _orderService.RejectAndReassign(orderId, courierId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // ================= 6. עדכון סטטוס =================

        [HttpPut("{orderId}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int orderId, [FromBody] OrderStatus status)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("id")!.Value);
                var role = User.FindFirst(ClaimTypes.Role)?.Value ?? "";

                var result = await _orderService.UpdateStatus(orderId, status, userId, role);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}