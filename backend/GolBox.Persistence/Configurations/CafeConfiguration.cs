using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class CafeConfiguration : IEntityTypeConfiguration<Cafe>
{
    public void Configure(EntityTypeBuilder<Cafe> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Code).HasMaxLength(40).IsRequired();
        builder.Property(c => c.Name).HasMaxLength(256).IsRequired();
        builder.Property(c => c.Description).HasMaxLength(1000);
        builder.Property(c => c.Address).HasMaxLength(500).IsRequired();
        builder.Property(c => c.City).HasMaxLength(120).IsRequired();
        builder.Property(c => c.District).HasMaxLength(120).IsRequired();
        builder.Property(c => c.PhoneNumber).HasMaxLength(30);
        builder.Property(c => c.PickupStatus).HasMaxLength(20).IsRequired();
        builder.Property(c => c.PickupPausedBy).HasMaxLength(200);
        builder.Property(c => c.PickupPauseReason).HasMaxLength(500);
        builder.Property(c => c.Latitude).HasColumnType("decimal(18,10)").IsRequired();
        builder.Property(c => c.Longitude).HasColumnType("decimal(18,10)").IsRequired();
        builder.Property(c => c.ImageUrl).HasMaxLength(1000);

        builder.HasIndex(c => c.IsDeleted).HasFilter("IsDeleted = 0");
        builder.HasIndex(c => c.Code).IsUnique();
        builder.HasIndex(c => c.PlaceId);

        builder.HasOne(c => c.Organization)
            .WithMany(o => o.Cafes)
            .HasForeignKey(c => c.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Category)
            .WithMany(cc => cc.Cafes)
            .HasForeignKey(c => c.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Place)
            .WithMany(p => p.Cafes)
            .HasForeignKey(c => c.PlaceId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
