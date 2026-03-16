using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Service.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;

        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        [HttpPost("{customerId}")]
        public async Task<IActionResult> Create(int customerId, [FromBody] Order order)
        {
            var result = await _orderService.CreateOrder(customerId, order);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _orderService.GetById(id);

            if (order == null)
                return NotFound();

            return Ok(order);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _orderService.GetAll());
        }

        [HttpPut("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] OrderStatus status)
        {
            var updated = await _orderService.UpdateStatus(id, status);
            return Ok(updated);
        }

        [HttpPut("{orderId}/assign/{courierId}")]
        public async Task<IActionResult> AssignCourier(int orderId, int courierId)
        {
            var result = await _orderService.AssignCourier(orderId, courierId);
            return Ok(result);
        }
    }
}