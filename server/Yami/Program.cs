using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.SignalR;
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

            // ===== 1. Services =====
            builder.Services.AddControllers();
            builder.Services.AddSignalR();

            // ⭐ חשוב: מאפשר לזהות משתמשים ב-SignalR לפי JWT
            builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();

            // ===== 2. Database =====
            builder.Services.AddDbContext<YamiDbContext>(options =>
                options.UseSqlServer(
                    builder.Configuration.GetConnectionString("DefaultConnection"),
                    b => b.MigrationsAssembly("Yami")
                ));

            // ===== 3. Swagger =====
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

                c.AddSecurityRequirement(new OpenApiSecurityRequirement {
                {
                    new OpenApiSecurityScheme {
                        Reference = new OpenApiReference {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new string[] {}
                }});
            });

            // ===== 4. JWT Authentication =====
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
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
                        ClockSkew = TimeSpan.Zero
                    };

                    // ⭐ קריטי ל-SignalR (קבלת טוקן דרך URL)
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            if (!string.IsNullOrEmpty(accessToken) &&
                                path.StartsWithSegments("/trackingHub"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            // ===== 5. CORS =====
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactDev", policy =>
                {
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials(); // חובה ל-SignalR
                });
            });

            // ===== 6. Dependency Injection =====

            builder.Services.AddScoped<IContext, YamiDbContext>();

            // Services
            builder.Services.AddScoped<ITrackingService, TrackingService>();
            builder.Services.AddScoped<IOrderService, OrderService>();
            builder.Services.AddScoped<IUserService, UserService>();
            builder.Services.AddScoped<IMenuService, MenuService>();
            builder.Services.AddScoped<IStoreService, StoreService>();
            builder.Services.AddScoped<IAuthService, AuthService>();
            builder.Services.AddScoped<CourierMatchingService>();

            // Repositories
            builder.Services.AddScoped<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IRepository<User>, UserRepository>();
            builder.Services.AddScoped<IRepository<Courier>, CouriersRepository>();
            builder.Services.AddScoped<IRepository<Menu>, MenusRepository>();
            builder.Services.AddScoped<IRepository<Store>, StoreRepository>();
            builder.Services.AddScoped<IRepository<Order>, OrderRepository>();
            builder.Services.AddScoped<IRepository<Delivery>, DeliveryRepository>();
            builder.Services.AddScoped<IRepository<DeliveryOrder>, DeliveryOrderRepository>();
            builder.Services.AddScoped<IRepository<DeliveryOffer>, DeliveryOfferRepository>();
            builder.Services.AddScoped<IRepository<CourierTracking>, CourierTrackingRepository>();

            var app = builder.Build();

            // ===== 7. Middleware =====

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseCors("AllowReactDev"); // חשוב לפני Auth

            app.UseAuthentication();
            app.UseAuthorization();

            // ===== 8. Endpoints =====
            app.MapHub<TrackingHub>("/trackingHub");
            app.MapControllers();

            app.Run();
        }
    }

    // ⭐ מאפשר לשלוח הודעות לשליח ספציפי לפי ה-ID מהטוקן
    public class CustomUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            return connection.User?.FindFirst("id")?.Value!;
        }
    }
}