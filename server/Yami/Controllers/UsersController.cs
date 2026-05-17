using Common.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repository.Entities;
using Service.Interfaces;
using System.Security.Claims;

namespace API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IAuthService _authService; // שירות ה-Auth החדש שהוזרק

        // ה-Constructor מעודכן לקבלת שני השירותים
        public UsersController(IUserService userService, IAuthService authService)
        {
            _userService = userService;
            _authService = authService;
        }

        // ADD-REGISTER (מעודכן ל-Auto Login)
        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> Register([FromBody] UserCreateDto dto)
        {
            try
            {
                // יצירת אובייקט המשתמש החדש מתוך ה-DTO
                var user = new User
                {
                    Name = dto.Name,
                    Email = dto.Email,
                    Password = dto.Password, // ה-Hashing מבוצע בתוך ה-UserService.Add
                    Phone = dto.Phone,
                    Role = Role.Customer // הגדרת תפקיד ברירת מחדל (או לפי בחירה מה-DTO)
                };

                // 1. שמירת המשתמש החדש במסד הנתונים
                var created = await _userService.Add(user);

                // 2. יצירת טוקן JWT אוטומטי מיד לאחר ההרשמה
                // מעבירים true כדי שה-AuthService ידע להנפיק טוקן ארוך טווח (30 יום)
                var token = await _authService.Login(created.Email, dto.Password, true);

                // 3. החזרת האובייקט המלא עם הטוקן ל-React
                return Ok(new
                {
                    Token = token,
                    Email = created.Email,
                    Role = created.Role.ToString()
                });
            }
            catch (Exception ex)
            {
                // מחזירים אובייקט JSON מסודר עם הודעת השגיאה כדי שה-React יוכל לקרוא אותה ב-data.message
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            return Ok(await _userService.GetById(id));
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _userService.GetAll());
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] User user)
        {
            var result = await _userService.Update(id, user);
            return Ok(result);
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return Ok(await _userService.Delete(id));
        }
        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetUserProfile()
        {
            // שליפת ה-ID של המשתמש מתוך ה-Claims של ה-Token המחובר
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            int userId = int.Parse(userIdClaim);

            // שליפה ישירה מטבלת המשתמשים ב-DB
            var user = await _userService.GetById(userId);
            if (user == null) return NotFound("User not found");

            // החזרת השם בצורה מאובטחת לקליינט
            return Ok(new { name = user.Name });
        }
    }
}