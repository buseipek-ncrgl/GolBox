using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class CafeCategoryConfiguration : IEntityTypeConfiguration<CafeCategory>
{
    public void Configure(EntityTypeBuilder<CafeCategory> builder)
    {
        builder.HasKey(cc => cc.Id);

        builder.Property(cc => cc.Name)
            .IsRequired()
            .HasMaxLength(256);

        // Soft delete index
        builder.HasIndex(cc => cc.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Relationships
        builder.HasOne(cc => cc.Organization)
            .WithMany()
            .HasForeignKey(cc => cc.OrganizationId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
