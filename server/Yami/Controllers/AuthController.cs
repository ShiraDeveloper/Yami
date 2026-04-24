using Microsoft.AspNetCore.Mvc;
using Service.Interfaces;

namespace Yami.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        public record LoginRequest(string Email, string Password);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var token = await _authService.Login(request.Email, request.Password);

                // אם השרות החזיר null, סימן שהפרטים שגויים
                if (token == null)
                {
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                return Ok(new { token });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}