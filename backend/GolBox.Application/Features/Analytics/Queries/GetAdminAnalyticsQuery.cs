using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Common;
using GolBox.Application.Interfaces;

namespace GolBox.Application.Features.Analytics.Queries;

public record GetAdminAnalyticsQuery(
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    Guid? BranchId = null
) : IRequest<Result<AdminAnalyticsDto>>;

public record AdminAnalyticsDto(
    int TotalUsersCount,
    int TotalOrdersCount,
    int CompletedOrdersCount,
    int TotalItemsSoldQuantity,
    decimal RecordedSalesRevenue,
    decimal AverageOrderAmount,
    int TotalPointsDistributed,
    int TotalPointsRedeemed,
    List<TopCafeDto> TopCafes,
    List<TopProductDto> TopProducts,
    List<TopRewardDto> TopRewards,
    List<BusyHourDto> BusyHours
);

public record TopCafeDto(
    string CafeName,
    int OrderCount,
    decimal TotalSalesAmount
);

public record TopProductDto(
    string ProductName,
    int SoldQuantity,
    decimal TotalRevenue
);

public record TopRewardDto(
    string RewardTitle,
    int ClaimCount
);

public record BusyHourDto(
    int Hour,
    int OrderCount
);

public class GetAdminAnalyticsQueryHandler : IRequestHandler<GetAdminAnalyticsQuery, Result<AdminAnalyticsDto>>
{
    private readonly IAppDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GetAdminAnalyticsQueryHandler(IAppDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Result<AdminAnalyticsDto>> Handle(GetAdminAnalyticsQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var currentUserId = _currentUserService.UserId;
            Guid orgId = Guid.Empty;

            if (currentUserId.HasValue && currentUserId.Value != Guid.Empty)
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == currentUserId.Value, cancellationToken);
                if (user != null)
                {
                    orgId = user.OrganizationId;
                }
                else
                {
                    var staff = await _context.StaffUsers
                        .Include(s => s.User)
                        .FirstOrDefaultAsync(s => s.Id == currentUserId.Value || s.UserId == currentUserId.Value, cancellationToken);
                    if (staff?.User != null)
                    {
                        orgId = staff.User.OrganizationId;
                    }
                }
            }

            var from = request.FromDate ?? DateTime.UtcNow.AddDays(-30);
            var to = request.ToDate ?? DateTime.UtcNow;

            // Total users count
            var usersQuery = _context.Users.AsQueryable();
            if (orgId != Guid.Empty)
            {
                usersQuery = usersQuery.Where(u => u.OrganizationId == orgId);
            }
            var totalUsers = await usersQuery.CountAsync(cancellationToken);

            // Fetch Orders for Date Range & Branch Scope
            var ordersQuery = _context.Orders
                .Include(o => o.Cafe)
                .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.MenuItem)
                .Where(o => o.CreatedDate >= from && o.CreatedDate <= to);

            if (orgId != Guid.Empty)
            {
                ordersQuery = ordersQuery.Where(o => o.OrganizationId == orgId);
            }

            if (request.BranchId.HasValue && request.BranchId != Guid.Empty)
            {
                ordersQuery = ordersQuery.Where(o => o.CafeId == request.BranchId.Value);
            }

            var ordersList = await ordersQuery.ToListAsync(cancellationToken);

            var totalOrders = ordersList.Count;
            var completedOrders = ordersList.Where(o => o.Status == "Completed").ToList();
            var completedOrdersCount = completedOrders.Count;

            // Authoritative Recorded Sales Revenue: ONLY Completed Orders with PAID status
            var recordedSalesRevenue = completedOrders
                .Where(o => o.PaymentStatus == "PAID" || o.PaidWithPoints)
                .Sum(o => o.TotalAmount);

            var averageOrderAmount = completedOrdersCount > 0 ? Math.Round(recordedSalesRevenue / completedOrdersCount, 2) : 0m;

            // Total Items Sold Quantity (Only Completed Orders)
            var completedOrderItems = completedOrders.SelectMany(o => o.OrderItems).ToList();
            var totalItemsSoldQuantity = completedOrderItems.Sum(oi => oi.Quantity);

            // Top Sold Products from Completed Orders
            var topProducts = completedOrderItems
                .GroupBy(oi => !string.IsNullOrEmpty(oi.ProductName) ? oi.ProductName : (oi.MenuItem?.Name ?? "Bilinmeyen Ürün"))
                .Select(g => new TopProductDto(
                    g.Key,
                    g.Sum(oi => oi.Quantity),
                    g.Sum(oi => oi.Quantity * (oi.FinalUnitPrice > 0 ? oi.FinalUnitPrice : oi.UnitPrice))
                ))
                .OrderByDescending(dto => dto.SoldQuantity)
                .Take(5)
                .ToList();

            // Branch Performance
            var topCafes = ordersList
                .GroupBy(o => o.Cafe?.Name ?? "Bilinmeyen Şube")
                .Select(g => new TopCafeDto(
                    g.Key,
                    g.Count(),
                    g.Where(o => o.Status == "Completed" && (o.PaymentStatus == "PAID" || o.PaidWithPoints)).Sum(o => o.TotalAmount)
                ))
                .OrderByDescending(dto => dto.OrderCount)
                .Take(5)
                .ToList();

            // Busy Hours Aggregation from Orders
            var busyHours = ordersList
                .GroupBy(o => o.CreatedDate.Hour)
                .Select(g => new BusyHourDto(g.Key, g.Count()))
                .OrderBy(dto => dto.Hour)
                .ToList();

            // Total points distributed & redeemed
            var pointsQuery = _context.PointTransactions.AsQueryable();
            if (orgId != Guid.Empty)
            {
                pointsQuery = pointsQuery.Where(pt => pt.OrganizationId == orgId);
            }
            var pointsInfo = await pointsQuery.Select(pt => pt.Amount).ToListAsync(cancellationToken);

            var pointsDistributed = pointsInfo.Where(a => a > 0).Sum();
            var pointsRedeemed = Math.Abs(pointsInfo.Where(a => a < 0).Sum());

            // Top rewards claimed
            var rewardsQuery = _context.UserRewards.Include(ur => ur.Reward).AsQueryable();
            if (orgId != Guid.Empty)
            {
                rewardsQuery = rewardsQuery.Where(ur => ur.OrganizationId == orgId);
            }
            var userRewardsList = await rewardsQuery.ToListAsync(cancellationToken);

            var topRewards = userRewardsList
                .GroupBy(ur => ur.Reward?.Title ?? "Bilinmeyen İkram")
                .Select(g => new TopRewardDto(
                    g.Key,
                    g.Count()
                ))
                .OrderByDescending(dto => dto.ClaimCount)
                .Take(5)
                .ToList();

            var analytics = new AdminAnalyticsDto(
                totalUsers,
                totalOrders,
                completedOrdersCount,
                totalItemsSoldQuantity,
                recordedSalesRevenue,
                averageOrderAmount,
                pointsDistributed,
                pointsRedeemed,
                topCafes,
                topProducts,
                topRewards,
                busyHours
            );

            return Result<AdminAnalyticsDto>.Ok(analytics, "Yönetici analitik raporu başarıyla hazırlandı.");
        }
        catch (Exception ex)
        {
            return Result<AdminAnalyticsDto>.Fail($"Analitik hesaplanırken hata oluştu: {ex.Message}");
        }
    }
}
