using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class UserActivityConfiguration : IEntityTypeConfiguration<UserActivity>
{
    public void Configure(EntityTypeBuilder<UserActivity> builder)
    {
        builder.HasKey(ua => ua.Id);

        // Soft delete index
        builder.HasIndex(ua => ua.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Relationships
        builder.HasOne(ua => ua.User)
            .WithMany()
            .HasForeignKey(ua => ua.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ua => ua.Activity)
            .WithMany(a => a.UserActivities)
            .HasForeignKey(ua => ua.ActivityId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ua => ua.Organization)
            .WithMany()
            .HasForeignKey(ua => ua.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
