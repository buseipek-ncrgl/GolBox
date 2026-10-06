using GolBox.Api.Controllers;
using GolBox.Api.Hubs;
using GolBox.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Task = System.Threading.Tasks.Task;

namespace GolBox.Tests;

public class CatalogPricingTests
{
    [Fact]
    public async Task Order_Uses_Server_Option_Prices_And_Persists_Snapshot()
    {
        var (connection, db) = TestDb.OpenCreated();
        await using var _ = connection;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        cafe.PickupStatus = "AVAILABLE";
        var user = TestData.Citizen(points: 1000);
        var product = new MenuItem { Id = Guid.NewGuid(), CafeId = cafe.Id, Name = "Latte", Description = "Test", Price = 50, IsActive = true };
        var group = new ProductOptionGroup { Id = Guid.NewGuid(), MenuItemId = product.Id, Name = "Boyut", Required = true, MinSelections = 1, MaxSelections = 1 };
        var option = new ProductOption { Id = Guid.NewGuid(), OptionGroupId = group.Id, Name = "Büyük", PriceModifier = 15, IsActive = true };

        db.Organizations.Add(TestData.Org());
        db.CafeCategories.Add(category);
        db.Cafes.Add(cafe);
        db.Users.Add(user);
        db.MenuItems.Add(product);
        db.ProductOptionGroups.Add(group);
        db.ProductOptions.Add(option);
        db.BranchProducts.Add(new BranchProduct { Id = Guid.NewGuid(), CafeId = cafe.Id, MenuItemId = product.Id, IsAvailable = true });
        await db.SaveChangesAsync();

        var controller = new OrdersController(db, new FakeCurrentUser { UserId = user.Id, Role = "User" }, new FakeHubContext<OrderHub>());
        var result = await controller.CreateOrder(new CreateOrderRequest
        {
            UserId = user.Id,
            CafeId = cafe.Id,
            Items = [new CreateOrderItemRequest { MenuItemId = product.Id, Quantity = 2, SelectedOptionIds = [option.Id] }]
        });

        Assert.Equal(200, ActionResultAssert.Status(result));
        var order = await db.Orders.Include(x => x.OrderItems).SingleAsync();
        Assert.Equal(130m, order.TotalAmount);
        var orderItem = Assert.Single(order.OrderItems);
        Assert.Equal(15m, orderItem.OptionPricesSum);
        Assert.Equal(65m, orderItem.FinalUnitPrice);
        Assert.Contains(option.Id.ToString(), orderItem.SelectedOptionsJson);
    }

    [Fact]
    public async Task Order_Rejects_Option_From_Another_Product()
    {
        var (connection, db) = TestDb.OpenCreated();
        await using var _ = connection;
        await using var __ = db;
        var category = TestData.Category();
        var cafe = TestData.Cafe();
        cafe.CategoryId = category.Id;
        cafe.PickupStatus = "AVAILABLE";
        var user = TestData.Citizen();
        var product = new MenuItem { Id = Guid.NewGuid(), CafeId = cafe.Id, Name = "Kahve", Description = "Test", Price = 40, IsActive = true };
        var other = new MenuItem { Id = Guid.NewGuid(), CafeId = cafe.Id, Name = "Çay", Description = "Test", Price = 20, IsActive = true };
        var group = new ProductOptionGroup { Id = Guid.NewGuid(), MenuItemId = other.Id, Name = "Ekstra", Required = false, MinSelections = 0, MaxSelections = 1 };
        var foreignOption = new ProductOption { Id = Guid.NewGuid(), OptionGroupId = group.Id, Name = "Hileli", PriceModifier = -100, IsActive = true };

        db.AddRange(TestData.Org(), category, cafe, user, product, other, group, foreignOption);
        db.BranchProducts.Add(new BranchProduct { Id = Guid.NewGuid(), CafeId = cafe.Id, MenuItemId = product.Id, IsAvailable = true });
        await db.SaveChangesAsync();

        var controller = new OrdersController(db, new FakeCurrentUser { UserId = user.Id, Role = "User" }, new FakeHubContext<OrderHub>());
        var result = await controller.CreateOrder(new CreateOrderRequest
        {
            UserId = user.Id,
            CafeId = cafe.Id,
            Items = [new CreateOrderItemRequest { MenuItemId = product.Id, Quantity = 1, SelectedOptionIds = [foreignOption.Id] }]
        });

        Assert.Equal(400, ActionResultAssert.Status(result));
        Assert.Empty(db.Orders);
    }
}
