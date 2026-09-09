using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.TotalAmount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(x => x.PaidWithPoints)
            .IsRequired();

        builder.Property(x => x.PointsUsed)
            .IsRequired();

        builder.Property(x => x.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(x => x.CollectionCode)
            .IsRequired()
            .HasMaxLength(50);

        // Relationships
        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Cafe)
            .WithMany()
            .HasForeignKey(x => x.CafeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global query filter for soft delete
        builder.HasQueryFilter(x => !x.IsDeleted);
        builder.HasIndex(x => x.IsDeleted).HasFilter("IsDeleted = 0");
    }
}
