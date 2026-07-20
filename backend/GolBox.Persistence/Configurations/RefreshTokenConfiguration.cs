using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.HasKey(t => t.Id);

        builder.Property(t => t.TokenHash)
            .IsRequired()
            .HasMaxLength(512);

        builder.Property(t => t.CreatedByIp)
            .IsRequired()
            .HasMaxLength(64);

        builder.Property(t => t.RevokedByIp)
            .HasMaxLength(64);

        // Soft delete index
        builder.HasIndex(t => t.IsDeleted)
            .HasFilter("[IsDeleted] = 0");

        // Self relationship for replaced token
        builder.HasOne(t => t.ReplacedByToken)
            .WithMany()
            .HasForeignKey(t => t.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
