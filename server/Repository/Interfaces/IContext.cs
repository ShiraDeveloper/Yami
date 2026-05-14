using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Repository.Entities;

namespace Repository.Interfaces
{
    public interface IContext
    {
        public DbSet<Courier> Couriers { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<Delivery> Delivery { get; set; }
        public DbSet<OrderItem> OrderItem { get; set; }
        public DbSet<CourierTracking> CourierTracking { get; set; }
        public DbSet<DeliveryOffer> DeliveryOffer { get; set; }
        public DbSet<DeliveryOrder> DeliveryOrder { get; set; }
        Task Save();
        Task<int> SaveChangesAsync();
    }
}
