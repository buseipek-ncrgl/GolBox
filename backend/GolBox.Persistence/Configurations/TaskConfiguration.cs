using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Task = GolBox.Domain.Entities.Task;

namespace GolBox.Persistence.Configurations;

public class TaskConfiguration : IEntityTypeConfiguration<Task>
{
    public void Configure(EntityTypeBuilder<Task> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(t => t.Description)
            .IsRequired()
            .HasMaxLength(1000);

        builder.Property(t => t.PointsReward)
            .IsRequired();

        builder.Property(t => t.Status)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.ShortDescription).HasMaxLength(300);
        builder.Property(t => t.Category).HasMaxLength(50);
        builder.Property(t => t.MissionType).HasMaxLength(50);
        builder.Property(t => t.TargetAudience).HasMaxLength(50);
        builder.Property(t => t.HowToCompleteJson).HasMaxLength(2000);
        builder.HasIndex(t => new { t.OrganizationId, t.Status, t.StartDate, t.EndDate });

        // Soft delete index
        builder.HasIndex(t => t.IsDeleted)
            .HasFilter("IsDeleted = 0");

        // Relationships
        builder.HasOne(t => t.Organization)
            .WithMany()
            .HasForeignKey(t => t.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
