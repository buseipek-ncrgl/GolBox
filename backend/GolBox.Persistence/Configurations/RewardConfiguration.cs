using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class RewardConfiguration : IEntityTypeConfiguration<Reward>
{
    public void Configure(EntityTypeBuilder<Reward> builder)
    {
        builder.HasKey(r => r.Id);

        builder.Property(r => r.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(r => r.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(r => r.RequiredPoints)
            .IsRequired();

        builder.Property(r => r.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(r => r.ImageUrl)
            .HasMaxLength(1000);

        builder.Property(r => r.PerUserLimit).HasDefaultValue(1);
        builder.Property(r => r.RequiredEducation).HasMaxLength(100);
        builder.HasIndex(r => new { r.OrganizationId, r.Status });

        // Soft delete index
        builder.HasIndex(r => r.IsDeleted)
            .HasFilter("IsDeleted = 0");

        // Relationships
        builder.HasOne(r => r.Organization)
            .WithMany()
            .HasForeignKey(r => r.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
