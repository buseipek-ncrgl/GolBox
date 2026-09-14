using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class FieldDropConfiguration : IEntityTypeConfiguration<FieldDrop>
{
    public void Configure(EntityTypeBuilder<FieldDrop> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Title)
            .IsRequired()
            .HasMaxLength(256);

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.Property(x => x.Latitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.Property(x => x.Longitude)
            .HasColumnType("decimal(18,10)")
            .IsRequired();

        builder.Property(x => x.ImageUrl).HasMaxLength(1000);
        builder.Property(x => x.ModelGlbUrl).HasMaxLength(1000);

        builder.Property(x => x.RowVersion)
            .IsConcurrencyToken()
            .HasDefaultValue(0);

        builder.HasIndex(x => x.IsDeleted).HasFilter("IsDeleted = 0");
        builder.HasIndex(x => new { x.OrganizationId, x.IsActive });

        builder.HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Cafe)
            .WithMany()
            .HasForeignKey(x => x.CafeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.CatalogReward)
            .WithMany()
            .HasForeignKey(x => x.CatalogRewardId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
