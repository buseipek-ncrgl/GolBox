using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class OrganizationConfiguration : IEntityTypeConfiguration<Organization>
{
    public void Configure(EntityTypeBuilder<Organization> builder)
    {
        builder.HasKey(o => o.Id);

        builder.Property(o => o.Name)
            .IsRequired()
            .HasMaxLength(256);

        builder.HasIndex(o => o.Name)
            .IsUnique();

        builder.Property(o => o.ThemeColor)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(o => o.LogoUrl)
            .HasMaxLength(1000);

        builder.Property(o => o.TimeZone)
            .IsRequired()
            .HasMaxLength(100);

        // Soft delete filtered index
        builder.HasIndex(o => o.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Relationships
        builder.HasMany(o => o.Users)
            .WithOne(u => u.Organization)
            .HasForeignKey(u => u.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Settings)
            .WithOne(s => s.Organization)
            .HasForeignKey(s => s.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
