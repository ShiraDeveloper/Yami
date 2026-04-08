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

        [HttpPost]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> Create([FromBody] OrderCreateDto dto)
        {
            var userId = int.Parse(User.FindFirst("id")!.Value);

            var result = await _orderService.CreateOrder(userId, dto);
            return Ok(result);
        }

        [HttpGet("my-orders")]
        [Authorize(Roles = "Customer")]
        public async Task<IActionResult> GetMyOrders()
        {
            var userId = int.Parse(User.FindFirst("id")!.Value);

            var orders = await _orderService.GetAll();
            var userOrders = orders.Where(o => o.CustomerId == userId);

            return Ok(userOrders);
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _orderService.GetAll());
        }

        [HttpPut("{orderId}/assign")]
        [Authorize(Roles = "Courier")]
        public async Task<IActionResult> AssignToMe(int orderId)
        {
            var courierId = int.Parse(User.FindFirst("id")!.Value);

            var result = await _orderService.AssignCourier(orderId, courierId);
            return Ok(result);
        }

        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatus status, int userId, string role)
        {
            return Ok(await _orderService.UpdateStatus(id, status,userId,role));
        }
    }
}