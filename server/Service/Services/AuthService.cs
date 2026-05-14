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

    public async Task<string?> Login(string email, string password)
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

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}