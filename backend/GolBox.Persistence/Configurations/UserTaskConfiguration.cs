using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;
using Task = GolBox.Domain.Entities.Task;

namespace GolBox.Persistence.Configurations;

public class UserTaskConfiguration : IEntityTypeConfiguration<UserTask>
{
    public void Configure(EntityTypeBuilder<UserTask> builder)
    {
        builder.HasKey(ut => ut.Id);

        // Soft delete index
        builder.HasIndex(ut => ut.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Compounded index for quick completion checks
        builder.HasIndex(ut => new { ut.UserId, ut.TaskId });

        // Relationships
        builder.HasOne(ut => ut.User)
            .WithMany()
            .HasForeignKey(ut => ut.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ut => ut.Task)
            .WithMany(t => t.UserTasks)
            .HasForeignKey(ut => ut.TaskId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ut => ut.Organization)
            .WithMany()
            .HasForeignKey(ut => ut.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
