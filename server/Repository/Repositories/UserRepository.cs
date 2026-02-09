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
    internal class UserRepository:IRepository<Users>
    {
        private readonly IContext ctx;
        public UserRepository(IContext context) {
            ctx=context;    
        }

        public async Task<Users> Add(Users user)
        {
            ctx.Users.Add(user);
            await ctx.Save();
            return user;

        }

        public async Task<Users> Delete(int id)
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

        public Task<List<Users>> GetAll()
        {
            return ctx.Users.ToListAsync();
        }

        public async Task<Users> GetById(int id)
        {
            return await ctx.Users.FirstOrDefaultAsync(x => x.Id == id);    
        }

        public async Task<Users> Update(Users user)
        {
            var existingUser = await ctx.Users.FirstOrDefaultAsync(x => x.Id == user.Id);
            if (existingUser == null)
                return null;
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
