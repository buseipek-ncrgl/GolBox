using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class UserFieldCaptureConfiguration : IEntityTypeConfiguration<UserFieldCapture>
{
    public void Configure(EntityTypeBuilder<UserFieldCapture> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.CapturedLatitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.Property(x => x.CapturedLongitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.HasIndex(x => x.IsDeleted).HasFilter("IsDeleted = 0");
        builder.HasIndex(x => new { x.FieldDropId, x.UserId })
            .IsUnique()
            .HasFilter("IsDeleted = 0");

        builder.HasOne(x => x.FieldDrop)
            .WithMany()
            .HasForeignKey(x => x.FieldDropId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
