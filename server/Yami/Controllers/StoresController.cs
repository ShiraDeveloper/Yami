using Microsoft.AspNetCore.Mvc;
using Common.Dto;
using Service.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StoresController : ControllerBase
    {
        private readonly IStoreService _storeService;

        public StoresController(IStoreService storeService)
        {
            _storeService = storeService;
        }

        // GET: api/stores?userLat=..&userLng=..&search=..&kosher=..
        [HttpGet]
        public async Task<ActionResult<List<StoreDto>>> GetStores(
            [FromQuery] double userLat,
            [FromQuery] double userLng,
            [FromQuery] string? search = null,
            [FromQuery] string? kosher = null)
        {
            var stores = await _storeService.GetStores(userLat, userLng, search, kosher);

            return Ok(stores);
        }
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var storeDto = await _storeService.GetById(id);

                if (storeDto == null)
                {
                    return NotFound(new { message = "The requested store was not found." });
                }

                return Ok(storeDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }
}