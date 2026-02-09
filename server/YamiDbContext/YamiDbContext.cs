using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataContext
{
    public class YamiDbContext: DbContext, IContext
    {
        public DbSet<Couriers> Couriers { get; set; }
        public DbSet<Orders> Orders { get; set; }
        public DbSet<Stores> Stores { get; set; }
        public DbSet<Users> Users { get; set; }
        public YamiDbContext(DbContextOptions<YamiDbContext> options) : base(options)
        {
        }
        public async Task Save()
        {
            await base.SaveChangesAsync();
        }
    }
}
