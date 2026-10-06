using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class ProductAllergenConfiguration : IEntityTypeConfiguration<ProductAllergen>
{
    public void Configure(EntityTypeBuilder<ProductAllergen> builder)
    {
        builder.ToTable("ProductAllergens");

        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.MenuItem)
            .WithMany(x => x.ProductAllergens)
            .HasForeignKey(x => x.MenuItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Allergen)
            .WithMany(x => x.ProductAllergens)
            .HasForeignKey(x => x.AllergenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
