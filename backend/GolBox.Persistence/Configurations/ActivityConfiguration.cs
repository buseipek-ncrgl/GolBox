using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class ActivityConfiguration : IEntityTypeConfiguration<Activity>
{
    public void Configure(EntityTypeBuilder<Activity> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(a => a.Location)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(a => a.Status)
            .IsRequired()
            .HasMaxLength(50);

        // Soft delete index
        builder.HasIndex(a => a.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Relationships
        builder.HasOne(a => a.Organization)
            .WithMany()
            .HasForeignKey(a => a.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
