using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Common.Dto;
using Repository.Interfaces;
using Repository.Entities;
using Service.Interfaces;

namespace API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CourierController : ControllerBase
{
    private readonly ICourierMatchingService _courierService;
    private readonly IRepository<Courier> _courierRepository;
    private readonly ITrackingService _trackingService;

    public CourierController(
        ICourierMatchingService courierService,
        IRepository<Courier> courierRepository,
        ITrackingService trackingService)
    {
        _courierService = courierService;
        _courierRepository = courierRepository;
        _trackingService = trackingService;
    }

    [HttpGet("match")]
    public async Task<ActionResult<int?>> MatchCourier(
        double orderLat,
        double orderLng)
    {
        var courierId = await _courierService.FindBestCourier(orderLat, orderLng);

        if (courierId == null)
            return NotFound("No suitable courier found");

        return Ok(courierId);
    }


    [HttpGet("route/{courierId}")]
    [Authorize(Roles = "Delivery")]
    public async Task<IActionResult> GetRoute(
        int courierId,
        double newLat,
        double newLng)
    {
        var couriers = await _courierRepository.GetAll();

        var courier = couriers.FirstOrDefault(c => c.Id == courierId);

        if (courier == null)
            return NotFound("Courier not found");

        return Ok(new { courierId, message = "Route calculation not yet implemented" });
    }


    [HttpPost("update-location")]
    [Authorize(Roles = "Delivery")]
    public async Task<IActionResult> UpdateLocation([FromBody] CourierTrackingCreateDto dto)
    {
        await _trackingService.UpdateLocation(dto);
        return Ok();
    }


    [HttpGet("order/{orderId}/location")]
    [Authorize(Roles = "Customer,Delivery")]
    public async Task<IActionResult> GetOrderLocation(int orderId)
    {
        var result = await _trackingService.GetLocationByOrder(orderId);

        if (result == null)
            return NotFound("No tracking data found");

        return Ok(result);
    }

    [HttpGet("availability-status")]
    public async Task<IActionResult> GetAvailabilityStatus()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
        if (userIdClaim == null) return Unauthorized();
        int userId = int.Parse(userIdClaim.Value);

        var couriers = await _courierRepository.GetAll();
        var courier = couriers.FirstOrDefault(c => c.UserId == userId);

        if (courier == null)
            return NotFound("Courier profile not found for this user");

        return Ok(new { isAvailable = courier.IsAvailable });
    }

    [HttpPost("toggle-availability")]
    [Authorize(Roles = "Delivery")]
    public async Task<IActionResult> ToggleAvailability()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
        if (userIdClaim == null) return Unauthorized();
        int userId = int.Parse(userIdClaim.Value);

        var couriers = await _courierRepository.GetAll();
        var courier = couriers.FirstOrDefault(c => c.UserId == userId);

        if (courier == null)
            return NotFound("Courier profile not found");

        courier.IsAvailable = !courier.IsAvailable;

        await _courierRepository.Update(courier);

        return Ok(new { isAvailable = courier.IsAvailable, message = "Status updated successfully" });
    }
}