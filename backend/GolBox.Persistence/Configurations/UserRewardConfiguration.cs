using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class UserRewardConfiguration : IEntityTypeConfiguration<UserReward>
{
    public void Configure(EntityTypeBuilder<UserReward> builder)
    {
        builder.HasKey(ur => ur.Id);

        builder.Property(ur => ur.RedeemCode)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(ur => ur.Status)
            .IsRequired()
            .HasMaxLength(50);

        // Unique Redeem Code Index
        builder.HasIndex(ur => ur.RedeemCode)
            .IsUnique();

        // Soft delete index
        builder.HasIndex(ur => ur.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Relationships
        builder.HasOne(ur => ur.User)
            .WithMany()
            .HasForeignKey(ur => ur.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ur => ur.Reward)
            .WithMany(r => r.UserRewards)
            .HasForeignKey(ur => ur.RewardId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(ur => ur.Organization)
            .WithMany()
            .HasForeignKey(ur => ur.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
