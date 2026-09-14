using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class CafeConfiguration : IEntityTypeConfiguration<Cafe>
{
    public void Configure(EntityTypeBuilder<Cafe> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(c => c.Address)
            .IsRequired()
            .HasMaxLength(500);

        builder.Property(c => c.Latitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.Property(c => c.Longitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.Property(c => c.ImageUrl)
            .HasMaxLength(1000);

        // Soft delete index
        builder.HasIndex(c => c.IsDeleted)
            .HasFilter("IsDeleted = 0");

        // Relationships
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

        builder.HasIndex(c => c.PlaceId);
    }
}
