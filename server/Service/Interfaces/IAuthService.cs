using Common.Dto;

namespace Service.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponseDto> Login(string email, string password, bool rememberMe);
    }
}