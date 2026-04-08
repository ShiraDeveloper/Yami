using Microsoft.AspNetCore.Mvc;
using Common.Dto;
using Repository.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class CourierController : ControllerBase
{
    private readonly CourierMatchingService _courierService;
    private readonly IRepository<Courier> _courierRepository;

    public CourierController(
        CourierMatchingService courierService,
        IRepository<Courier> courierRepository)
    {
        _courierService = courierService;
        _courierRepository = courierRepository;
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

    // ================= 2. קבלת מסלול (WAZE STYLE) =================

    [HttpGet("route/{courierId}")]
    public async Task<ActionResult<CourierRouteDto>> GetRoute(
        int courierId,
        double newLat,
        double newLng)
    {
        var couriers = await _courierRepository.GetAll();

        var courier = couriers.FirstOrDefault(c => c.Id == courierId);

        if (courier == null)
            return NotFound("Courier not found");

        var route = _courierService.BuildRoute(courier, newLat, newLng);

        return Ok(route);
    }
}