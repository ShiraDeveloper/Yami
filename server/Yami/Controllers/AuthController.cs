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

        //  RememberMe 
        public record LoginRequest(string Email, string Password, bool RememberMe);

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var result = await _authService.Login(
                    request.Email,
                    request.Password,
                    request.RememberMe
                );

                if (result == null)
                {
                    return Unauthorized(new { error = "Invalid email or password" });
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error" });
            }
        }
    }
}