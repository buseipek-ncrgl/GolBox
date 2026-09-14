using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class CityContentConfiguration : IEntityTypeConfiguration<CityContent>
{
    public void Configure(EntityTypeBuilder<CityContent> builder)
    {
        builder.ToTable("CityContents");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Type).IsRequired().HasMaxLength(40);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(256);
        builder.Property(x => x.Subtitle).HasMaxLength(512);
        builder.Property(x => x.Body).HasMaxLength(8000);
        builder.Property(x => x.ImageUrl).HasMaxLength(1000);
        builder.Property(x => x.ImageFocus).HasMaxLength(64);
        builder.Property(x => x.CtaLabel).HasMaxLength(80);
        builder.Property(x => x.CtaType).IsRequired().HasMaxLength(40);
        builder.Property(x => x.CtaTarget).HasMaxLength(1000);
        builder.Property(x => x.AudienceType).IsRequired().HasMaxLength(40);
        builder.Property(x => x.AudienceEducationLevel).HasMaxLength(80);
        builder.Property(x => x.AuthorName).HasMaxLength(160);
        builder.Property(x => x.AuthorTitle).HasMaxLength(160);
        builder.Property(x => x.AuthorImageUrl).HasMaxLength(1000);

        builder.HasIndex(x => new { x.OrganizationId, x.IsPublished, x.Type });
        builder.HasIndex(x => new { x.OrganizationId, x.StartAt, x.EndAt, x.Priority });
        builder.HasIndex(x => x.ActivityId);

        builder.HasOne(x => x.Organization)
            .WithMany()
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Activity)
            .WithMany()
            .HasForeignKey(x => x.ActivityId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
