using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using Repository.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DataContext
{
    public class YamiDbContext: DbContext,IContext
    {
        private readonly string _connection;
        public YamiDbContext(string connectionString)
        {
            _connection = connectionString;
        }

        public DbSet<Courier> Couriers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Delivery> Delivery { get; set; }
        public DbSet<DeliveryOrder> DeliveryOrder { get; set; }
        public DbSet<OrderItem> OrderItem { get; set; }
        public DbSet<CourierTracking> CourierTracking { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<DeliveryOffer> deliveryOffers { get; set; }

        public async Task Save()
        {
            await base.SaveChangesAsync();
        }
        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.UseSqlServer(_connection);
        }

    }
}
