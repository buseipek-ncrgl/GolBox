using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class PointTransactionConfiguration : IEntityTypeConfiguration<PointTransaction>
{
    public void Configure(EntityTypeBuilder<PointTransaction> builder)
    {
        builder.HasKey(pt => pt.Id);

        builder.Property(pt => pt.Amount)
            .IsRequired();

        builder.Property(pt => pt.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(pt => pt.Description)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(pt => pt.ReferenceType)
            .HasMaxLength(100);

        // Soft delete index
        builder.HasIndex(pt => pt.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Indexes for performance
        builder.HasIndex(pt => new { pt.UserId, pt.CreatedDate });
        builder.HasIndex(pt => new { pt.UserId, pt.OrganizationId })
            .IncludeProperties(pt => new { pt.Amount, pt.Type, pt.CreatedDate });

        // Relationships
        builder.HasOne(pt => pt.User)
            .WithMany()
            .HasForeignKey(pt => pt.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(pt => pt.Organization)
            .WithMany()
            .HasForeignKey(pt => pt.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
