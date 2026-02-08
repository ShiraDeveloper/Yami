using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace Yami.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        public record LoginRequest(string Email, string Password);

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Email) || string.IsNullOrWhiteSpace(request?.Password))
            {
                return BadRequest(new { error = "Missing credentials" });
            }

            // Demo authentication: only a simple hard-coded check for local development.
            if (request.Email == "admin@local" && request.Password == "password")
            {
                return Ok(new { token = "demo-token-123" });
            }

            return Unauthorized(new { error = "Invalid credentials" });
        }
    }
}
