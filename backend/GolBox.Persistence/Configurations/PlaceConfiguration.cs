using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GolBox.Persistence.Configurations;

public class PlaceConfiguration : IEntityTypeConfiguration<Place>
{
    public void Configure(EntityTypeBuilder<Place> builder)
    {
        builder.ToTable("Places");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name).IsRequired().HasMaxLength(256);
        builder.Property(x => x.Slug).IsRequired().HasMaxLength(160);
        builder.Property(x => x.Category).IsRequired().HasMaxLength(40);
        builder.Property(x => x.ShortDescription).HasMaxLength(512);
        builder.Property(x => x.Description).HasMaxLength(8000);
        builder.Property(x => x.Address).HasMaxLength(500);
        builder.Property(x => x.District).HasMaxLength(120);
        builder.Property(x => x.Neighborhood).HasMaxLength(120);
        builder.Property(x => x.Latitude).HasColumnType("decimal(18,10)");
        builder.Property(x => x.Longitude).HasColumnType("decimal(18,10)");
        builder.Property(x => x.Phone).HasMaxLength(40);
        builder.Property(x => x.Email).HasMaxLength(256);
        builder.Property(x => x.WebsiteUrl).HasMaxLength(500);
        builder.Property(x => x.CoverImageUrl).HasMaxLength(1000);
        builder.Property(x => x.SearchNormalized).IsRequired().HasMaxLength(1000);

        builder.HasIndex(x => new { x.OrganizationId, x.Slug }).IsUnique();
        builder.HasIndex(x => new { x.OrganizationId, x.IsPublished, x.IsActive });
        builder.HasIndex(x => new { x.OrganizationId, x.Category });
        builder.HasIndex(x => new { x.OrganizationId, x.District });
        builder.HasIndex(x => new { x.OrganizationId, x.Neighborhood });
        builder.HasIndex(x => new { x.Latitude, x.Longitude });
        builder.HasIndex(x => x.SearchNormalized);

        builder.HasOne(x => x.Organization)
            .WithMany(o => o.Places)
            .HasForeignKey(x => x.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class PlaceImageConfiguration : IEntityTypeConfiguration<PlaceImage>
{
    public void Configure(EntityTypeBuilder<PlaceImage> builder)
    {
        builder.ToTable("PlaceImages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.ImageUrl).IsRequired().HasMaxLength(1000);
        builder.Property(x => x.AltText).HasMaxLength(200);
        builder.HasIndex(x => new { x.PlaceId, x.SortOrder });

        builder.HasOne(x => x.Place)
            .WithMany(p => p.Images)
            .HasForeignKey(x => x.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PlaceOpeningHourConfiguration : IEntityTypeConfiguration<PlaceOpeningHour>
{
    public void Configure(EntityTypeBuilder<PlaceOpeningHour> builder)
    {
        builder.ToTable("PlaceOpeningHours");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OpenTime).HasMaxLength(8);
        builder.Property(x => x.CloseTime).HasMaxLength(8);
        builder.HasIndex(x => new { x.PlaceId, x.DayOfWeek })
            .IsUnique()
            .HasFilter("IsDeleted = 0");

        builder.HasOne(x => x.Place)
            .WithMany(p => p.OpeningHours)
            .HasForeignKey(x => x.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PlaceAmenityConfiguration : IEntityTypeConfiguration<PlaceAmenity>
{
    public void Configure(EntityTypeBuilder<PlaceAmenity> builder)
    {
        builder.ToTable("PlaceAmenities");
        builder.HasKey(x => new { x.PlaceId, x.AmenityId });
        builder.Property(x => x.AmenityId).HasMaxLength(40);

        builder.HasOne(x => x.Place)
            .WithMany(p => p.Amenities)
            .HasForeignKey(x => x.PlaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
