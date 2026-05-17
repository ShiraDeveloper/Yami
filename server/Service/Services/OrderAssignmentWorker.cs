using DataContext;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Service.Interfaces;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

public class OrderAssignmentWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OrderAssignmentWorker> _logger;

    public OrderAssignmentWorker(IServiceProvider serviceProvider, ILogger<OrderAssignmentWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var context = scope.ServiceProvider.GetRequiredService<YamiDbContext>();
                    var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

                    // מחפש הזמנות שאין להן אף הצעה פתוחה (Accepted == null) ב-DB
                    var stuckOrders = await context.Orders
                        .Where(o => o.Status == OrderStatus.Approved &&
                                    o.CourierId == null &&
                                    !context.DeliveryOffer.Any(doff => doff.OrderId == o.Id && doff.Accepted == null))
                        .ToListAsync();

                    foreach (var order in stuckOrders)
                    {
                        _logger.LogInformation($"[Worker] Found stuck order {order.Id}. Resuming dispatch.");
                        await orderService.DispatchOrderSequential(order.Id);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in OrderAssignmentWorker");
            }

            // שיניתי ל-30 שניות כדי לתת לדיספאצ'ר זמן לעבוד בשקט
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}