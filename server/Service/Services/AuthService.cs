using Common.Dto;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Repository.Entities;
using Repository.Interfaces;
using Service.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class AuthService : IAuthService
{
    private readonly IRepository<User> _userRepository;
    private readonly IConfiguration _configuration;

    public AuthService(IRepository<User> userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration = configuration;
    }

    public async Task<LoginResponseDto> Login(string email, string password, bool rememberMe)
    {
        var allUsers = await _userRepository.GetAll();
        var user = allUsers.FirstOrDefault(u => u.Email.Trim().ToLower() == email.Trim().ToLower());

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.Password))
            return null;

        var claims = new[]
        {
            // שימוש ב-NameIdentifier לסנכרון מלא עם ה-Controller
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim("id", user.Id.ToString()) // לגיבוי עבור SignalR
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // שינוי קבוע: תוקף הטוקן יהיה תמיד ל-30 יום ללא תלות בבחירת המשתמש
        var expirationTime = DateTime.UtcNow.AddDays(30);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expirationTime,
            signingCredentials: creds);

        return new LoginResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.Id
        };
    }
}