using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class QrPaymentConfiguration : IEntityTypeConfiguration<QrPayment>
{
    public void Configure(EntityTypeBuilder<QrPayment> builder)
    {
        builder.HasKey(qp => qp.Id);

        builder.Property(qp => qp.Amount)
            .HasColumnType("decimal(18,2)")
            .IsRequired();

        builder.Property(qp => qp.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(qp => qp.Token)
            .IsRequired()
            .HasMaxLength(512);

        // Unique Qr Token Index
        builder.HasIndex(qp => qp.Token)
            .IsUnique();

        // Soft delete index
        builder.HasIndex(qp => qp.IsDeleted)
            .HasFilter("IsDeleted = 0");

        // Relationships
        builder.HasOne(qp => qp.User)
            .WithMany()
            .HasForeignKey(qp => qp.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qp => qp.Cafe)
            .WithMany()
            .HasForeignKey(qp => qp.CafeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(qp => qp.Organization)
            .WithMany()
            .HasForeignKey(qp => qp.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
