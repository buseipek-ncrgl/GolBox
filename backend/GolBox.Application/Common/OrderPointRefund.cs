using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Application.Common;

public static class OrderPointRefund
{
    public static bool TryRefundOnCancel(Order order, User payer, IAppDbContext context)
    {
        if (order.Status == OrderStatuses.Completed || order.Status == OrderStatuses.Cancelled)
            return false;

        if (!order.PaidWithPoints || order.PointsUsed <= 0)
            return false;

        var amount = order.PointsUsed;
        payer.PointsBalance += amount;
        context.PointTransactions.Add(new PointTransaction
        {
            Id = Guid.NewGuid(),
            OrganizationId = order.OrganizationId,
            UserId = payer.Id,
            Amount = amount,
            Type = "Refund",
            Description = $"Ismarlıyor iptal iadesi ({order.CollectionCode})",
            ReferenceType = "OrderCancel",
            ReferenceId = order.Id,
            CreatedDate = DateTime.UtcNow
        });
        order.PointsUsed = 0;
        return true;
    }
}
