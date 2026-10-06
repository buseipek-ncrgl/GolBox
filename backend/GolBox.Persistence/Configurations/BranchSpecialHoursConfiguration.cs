using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GolBox.Persistence.Configurations;

public class BranchSpecialHoursConfiguration : IEntityTypeConfiguration<BranchSpecialHours>
{
    public void Configure(EntityTypeBuilder<BranchSpecialHours> builder)
    {
        builder.ToTable("BranchSpecialHours");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OpenTime).HasMaxLength(5);
        builder.Property(x => x.CloseTime).HasMaxLength(5);
        builder.Property(x => x.Reason).HasMaxLength(250);

        builder.HasIndex(x => new { x.CafeId, x.Date }).IsUnique();
        builder.HasOne(x => x.Cafe)
            .WithMany()
            .HasForeignKey(x => x.CafeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
