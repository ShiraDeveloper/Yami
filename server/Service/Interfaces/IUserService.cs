using Repository.Entities;

namespace Service.Interfaces
{
    public interface IUserService : IService<User>
    {
        Task<User?> GetByEmail(string email);
    }
}