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

    // ================= 1. מציאת שליח =================

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

    // ================= 2. מסלול שליח =================

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

        // הערה: BuildRoute צריך להיות מממוש בשירות הקצאה
        return Ok(new { courierId, message = "Route calculation not yet implemented" });
    }

    // ================= 3. עדכון מיקום =================

    [HttpPost("update-location")]
    [Authorize(Roles = "Delivery")]
    public async Task<IActionResult> UpdateLocation([FromBody] CourierTrackingCreateDto dto)
    {
        await _trackingService.UpdateLocation(dto);
        return Ok();
    }

    // ================= 4. קבלת מיקום לפי הזמנה =================

    [HttpGet("order/{orderId}/location")]
    [Authorize(Roles = "Customer,Delivery")]
    public async Task<IActionResult> GetOrderLocation(int orderId)
    {
        var result = await _trackingService.GetLocationByOrder(orderId);

        if (result == null)
            return NotFound("No tracking data found");

        return Ok(result);
    }
    // ================= 5. ניהול זמינות שליח (מחובר/מנותק) =================

    [HttpGet("availability-status")]
    public async Task<IActionResult> GetAvailabilityStatus()
    {
        // חילוץ ה-UserId מהטוקן של השליח המחובר
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
        // חילוץ ה-UserId מהטוקן
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
        if (userIdClaim == null) return Unauthorized();
        int userId = int.Parse(userIdClaim.Value);

        var couriers = await _courierRepository.GetAll();
        var courier = couriers.FirstOrDefault(c => c.UserId == userId);

        if (courier == null)
            return NotFound("Courier profile not found");

        // היפוך הסטטוס
        courier.IsAvailable = !courier.IsAvailable;

        // עדכון באמצעות ה-Repository הקיים שלך
        await _courierRepository.Update(courier);

        return Ok(new { isAvailable = courier.IsAvailable, message = "Status updated successfully" });
    }
}