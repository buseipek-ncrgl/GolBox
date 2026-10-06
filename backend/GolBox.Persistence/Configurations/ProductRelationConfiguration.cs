using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Configurations;

public class ProductRelationConfiguration : IEntityTypeConfiguration<ProductRelation>
{
    public void Configure(EntityTypeBuilder<ProductRelation> builder)
    {
        builder.ToTable("ProductRelations");

        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.SourceProduct)
            .WithMany(x => x.ProductRelations)
            .HasForeignKey(x => x.SourceProductId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.TargetProduct)
            .WithMany()
            .HasForeignKey(x => x.TargetProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
