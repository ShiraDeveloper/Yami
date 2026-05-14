using Repository.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Interfaces
{
    public interface IUserRepository : IRepository<User>
    {
        Task<User?> GetByEmail(string email);
        Task<List<User>> GetCouriers();
    }
}
