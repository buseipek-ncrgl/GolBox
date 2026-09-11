using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GolBox.Application.Interfaces;

namespace GolBox.Infrastructure.Services;

public class ExpiredItemsCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredItemsCleanupService> _logger;
    private static readonly TimeSpan Interval = TimeSpan.FromMinutes(15);

    public ExpiredItemsCleanupService(IServiceProvider serviceProvider, ILogger<ExpiredItemsCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("GölBox ExpiredItemsCleanupService başlatıldı.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredItemsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Süresi dolan ögeleri temizlerken hata oluştu.");
            }

            await Task.Delay(Interval, stoppingToken);
        }
    }

    private async Task CleanupExpiredItemsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();
        var now = DateTime.UtcNow;

        // 1. Expire Field Drops
        var expiredDrops = await context.FieldDrops
            .Where(d => d.IsActive && d.EndsAt < now)
            .ToListAsync(cancellationToken);

        if (expiredDrops.Count > 0)
        {
            foreach (var drop in expiredDrops)
            {
                drop.IsActive = false;
                drop.UpdatedDate = now;
            }
            _logger.LogInformation("{Count} adet süresi geçen Saha Kutusu pasife alındı.", expiredDrops.Count);
        }

        // 2. Expire User Rewards / Coupons if expired
        var expiredRewards = await context.UserRewards
            .Where(r => r.Status == "Active" && r.ExpiresAt < now)
            .ToListAsync(cancellationToken);

        if (expiredRewards.Count > 0)
        {
            foreach (var reward in expiredRewards)
            {
                reward.Status = "Expired";
                reward.UpdatedDate = now;
            }
            _logger.LogInformation("{Count} adet süresi dolan kupon 'Expired' durumuna getirildi.", expiredRewards.Count);
        }

        await context.SaveChangesAsync(cancellationToken);
    }
}
