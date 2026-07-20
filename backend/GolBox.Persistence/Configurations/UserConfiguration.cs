using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.HasKey(u => u.Id);

        builder.Property(u => u.Email)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.NormalizedEmail)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(u => u.PasswordHash)
            .IsRequired();

        builder.Property(u => u.FirstName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.LastName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(u => u.PhoneNumber)
            .HasMaxLength(50);

        builder.Property(u => u.ProfileImageUrl)
            .HasMaxLength(1000);

        builder.Property(u => u.PointsBalance)
            .IsRequired()
            .HasDefaultValue(0);

        // Unique compound index: Email must be unique per Organization
        builder.HasIndex(u => new { u.Email, u.OrganizationId })
            .IsUnique();

        // Soft delete filtered index
        builder.HasIndex(u => u.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Multi-tenant indexes
        builder.HasIndex(u => new { u.OrganizationId, u.IsDeleted })
            .IncludeProperties(u => new { u.FirstName, u.LastName, u.PointsBalance });

        // Relationships
        builder.HasMany(u => u.RefreshTokens)
            .WithOne(t => t.User)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
