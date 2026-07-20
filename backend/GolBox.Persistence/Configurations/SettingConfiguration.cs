using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class SettingConfiguration : IEntityTypeConfiguration<Setting>
{
    public void Configure(EntityTypeBuilder<Setting> builder)
    {
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Key)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(s => s.Value)
            .IsRequired();

        builder.Property(s => s.Description)
            .HasMaxLength(500);

        // Unique Key per organization/tenant
        builder.HasIndex(s => new { s.OrganizationId, s.Key })
            .IsUnique();

        // Soft delete index
        builder.HasIndex(s => s.IsDeleted)
            .HasFilter("[IsDeleted] = 0");
    }
}
