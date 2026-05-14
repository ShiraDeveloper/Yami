using Microsoft.EntityFrameworkCore;
using Repository.Entities;
using Repository.Interfaces;
using System.Threading.Tasks;

namespace DataContext
{
    public class YamiDbContext : DbContext, IContext
    {
        public YamiDbContext(DbContextOptions<YamiDbContext> options) : base(options)
        {
        }

        // Entities
        public DbSet<User> Users { get; set; }
        public DbSet<Courier> Couriers { get; set; }
        public DbSet<Store> Stores { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<OrderItem> OrderItem { get; set; } // שינוי שם לרבים לצורך עקביות
        public DbSet<DeliveryOffer> DeliveryOffer { get; set; }
        public DbSet<CourierTracking> CourierTracking { get; set; }

        public DbSet<DeliveryOrder> DeliveryOrder { get; set; }
        public DbSet<Delivery> Delivery { get; set; }

        // הערה: הסרתי את Delivery ו-DeliveryOffer (ביחיד) כדי למנוע כפילויות ושגיאות FK

        public async Task Save()
        {
            await base.SaveChangesAsync();
        }

        public async Task<int> SaveChangesAsync()
        {
            return await base.SaveChangesAsync();
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer(
                    "Server=.;Database=YamiDb;Trusted_Connection=True;TrustServerCertificate=True"
                );
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --- User Configuration ---
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
            });

            // --- Courier Configuration ---
            modelBuilder.Entity<Courier>(entity =>
            {
                entity.HasKey(c => c.Id);
                entity.HasOne(c => c.User)
                      .WithOne(u => u.CourierProfile)
                      .HasForeignKey<Courier>(c => c.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Order Configuration ---
            modelBuilder.Entity<Order>(entity =>
            {
                entity.HasKey(o => o.Id);

                entity.HasOne(o => o.Customer)
                      .WithMany(u => u.Orders)
                      .HasForeignKey(o => o.CustomerId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(o => o.Store)
                      .WithMany(s => s.Orders)
                      .HasForeignKey(o => o.StoreId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(o => o.Courier)
                      .WithMany(c => c.Orders)
                      .HasForeignKey(o => o.CourierId)
                      .OnDelete(DeleteBehavior.SetNull);
            });

            // --- DeliveryOffer Configuration (התיקון המרכזי) ---
            modelBuilder.Entity<DeliveryOffer>(entity =>
            {
                entity.HasKey(doff => doff.Id);

                // קישור ישיר לטבלת Orders - זה מה שפותר את השגיאה בקונסול
                entity.HasOne(doff => doff.DeliveryOrder)
                      .WithMany()
                      .HasForeignKey(doff => doff.DeliveryOrderId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(doff => doff.Courier)
                      .WithMany(c => c.DeliveryOffers)
                      .HasForeignKey(doff => doff.CourierId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // --- OrderItem Configuration ---
            modelBuilder.Entity<OrderItem>(entity =>
            {
                entity.HasKey(oi => oi.Id);
                entity.HasOne(oi => oi.Order)
                      .WithMany(o => o.OrderItems)
                      .HasForeignKey(oi => oi.OrderId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // --- Menu Configuration ---
            modelBuilder.Entity<Menu>(entity =>
            {
                entity.HasKey(m => m.Id);
                entity.HasOne(m => m.Store)
                      .WithMany(s => s.Menus)
                      .HasForeignKey(m => m.StoreId);
            });
        }
    }
}