using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Repository.Interfaces;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserRepository _userRepository;

        public UsersController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        // ==========================
        // הרשמה
        // ==========================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            var existingUser = await _userRepository.GetByEmail(request.Email);
            if (existingUser != null)
                return BadRequest(new { message = "User already exists." });

            var user = new User
            {
                Name = request.Name,
                Email = request.Email,
                Password = request.Password, // אפשר גם עם hashing
                Role = Role.Customer
            };

            await _userRepository.Add(user);
            return Ok(new { message = "Registration successful." });
        }

        // ==========================
        // עדכון פרופיל
        // ==========================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = await _userRepository.GetById(id);
            if (user == null) return NotFound();

            user.Name = request.Name ?? user.Name;
            user.Email = request.Email ?? user.Email;
            user.Password = request.Password ?? user.Password;

            await _userRepository.Update(user);
            return Ok(user);
        }

        // ==========================
        // צפייה בפרופיל
        // ==========================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            var user = await _userRepository.GetById(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        public record RegisterRequest(string Name, string Email, string Password);
        public record UpdateUserRequest(string? Name, string? Email, string? Password);
    }
}