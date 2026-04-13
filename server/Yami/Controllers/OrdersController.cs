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
                var userId = int.Parse(User.FindFirst("id")!.Value);

                var orders = await _orderService.GetAll();

                var result = orders
                    .Where(o => o.CustomerId == userId)
                    .Select(o => new OrderDto
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
    }
}