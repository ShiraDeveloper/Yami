using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repository.Repositories
{
    public class UserRepository : IRepository<User>, IUserRepository
    {
        private readonly IContext ctx;

        public UserRepository(IContext context) {
            ctx=context;    
        }

        public async Task<User> Add(User user)
        {
            ctx.Users.Add(user);
            await ctx.Save();
            return user;

        }

        public async Task<User> Delete(int id)
        {
            var u = await ctx.Users.FirstOrDefaultAsync(x => x.Id == id);
            if (u != null)
            {
                ctx.Users.Remove(u);
                await ctx.Save();
                return u;
            }
            return null;
        }

        public Task<List<User>> GetAll()
        {
            return ctx.Users.ToListAsync();
        }

            public async Task<User?> GetByEmail(string email)
            {
                return await ctx.Users
                    .FirstOrDefaultAsync(u => u.Email == email);
            }

        public async Task<User> GetById(int id)
        {
            return await ctx.Users.FirstOrDefaultAsync(x => x.Id == id);    
        }

        public async Task<List<User>> GetCouriers()
        {
            return await ctx.Users
                .Where(u => u.Role == Role.Delivery)
                .ToListAsync();
        }
        public async Task<User> Update(User user)
        {
            var existingUser = await ctx.Users.FirstOrDefaultAsync(x => x.Id == user.Id);
            if (existingUser == null)
                return null;
            existingUser.Id= user.Id;
            existingUser.Role= user.Role;
            existingUser.CourierProfile= user.CourierProfile;
            existingUser.Orders= user.Orders;
            existingUser.Longitude = user.Longitude;
            existingUser.Latitude = user.Latitude;
            existingUser.Name = user.Name;
            existingUser.Email = user.Email;
            existingUser.Phone = user.Phone;
            existingUser.Password = user.Password;
            await ctx.Save();
            return existingUser;
        }
    }
}
