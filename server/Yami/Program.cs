using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using DataContext;
using Repository.Entities;
using Repository.Interfaces;
using Repository.Repositories;
using Service.Interfaces;
using Service.Services;
using Service.Implementations;

namespace Yami
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ===== Controllers =====
            builder.Services.AddControllers();

            // ===== חיבור למסד נתונים =====
            builder.Services.AddDbContext<YamiDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly("Yami")
                ));

            // ===== Swagger =====
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "Yami API", Version = "v1" });

                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Enter: Bearer {your token}",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            // ===== JWT Authentication =====
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
                    };
                });

            // ===== CORS =====
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactDev", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                });
            });

            // ===== DbContext =====
            builder.Services.AddScoped<IContext, YamiDbContext>();

            // ===== Services =====
            builder.Services.AddScoped<IRepository<Courier>, CouriersRepository>();
            builder.Services.AddScoped<CourierMatchingService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IMenuService, MenuService>();
            builder.Services.AddScoped<IStoreService, StoreService>();
            builder.Services.AddScoped<IAuthService, AuthService>();

            // ===== Repositories =====
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IRepository<User>, UserRepository>();

            builder.Services.AddScoped<IRepository<Menu>, MenusRepository>();
            builder.Services.AddScoped<IRepository<Store>, StoreRepository>();
            builder.Services.AddScoped<IRepository<Order>, OrderRepository>();
            builder.Services.AddScoped<IRepository<Delivery>, DeliveryRepository>();
            builder.Services.AddScoped<IRepository<DeliveryOrder>, DeliveryOrderRepository>();
            builder.Services.AddScoped<IRepository<DeliveryOffer>, DeliveryOfferRepository>();
            builder.Services.AddScoped<IRepository<CourierTracking>, CourierTrackingRepository>();
            builder.Services.AddSignalR();
            var app = builder.Build();

            //SignalR-for hubs to follow courier location in real time
            

            app.MapHub<TrackingHub>("/trackingHub");


            // ===== Middleware =====
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            app.UseHttpsRedirection();

            app.UseCors("AllowReactDev");

            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}