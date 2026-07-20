using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Context;

public static class DbInitializer
{
    public static async System.Threading.Tasks.Task SeedAsync(AppDbContext context, IPasswordHasher passwordHasher)
    {
        // Apply migrations automatically if any are pending
        if ((await context.Database.GetPendingMigrationsAsync()).Any())
        {
            await context.Database.MigrateAsync();
        }

        // 1. Seed Organization
        if (!await context.Organizations.AnyAsync())
        {
            var organization = new Organization
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Gölbaşı Belediyesi",
                ThemeColor = "#FF6600",
                LogoUrl = "https://golbasi.bel.tr/logo.png",
                TimeZone = "Europe/Istanbul"
            };
            context.Organizations.Add(organization);
            await context.SaveChangesAsync();
        }

        var orgId = Guid.Parse("11111111-1111-1111-1111-111111111111");

        // 2. Seed Settings
        if (!await context.Settings.AnyAsync(s => s.OrganizationId == orgId))
        {
            context.Settings.AddRange(
                new Setting { OrganizationId = orgId, Key = "rewardExpireDays", Value = "30", Description = "İkram kuponlarının geçerlilik süresi (gün)" },
                new Setting { OrganizationId = orgId, Key = "visitBonusPoints", Value = "15", Description = "QR okutma başına verilen ziyaret bonus puanı" },
                new Setting { OrganizationId = orgId, Key = "pointsExchangeRate", Value = "1", Description = "1 TL ödeme için harcanacak puan oranı (1 TL = 1 Puan)" },
                new Setting { OrganizationId = orgId, Key = "spendEarnRatePercent", Value = "10", Description = "Nakit harcamalarda geri kazanılan puan oranı (%)" }
            );
            await context.SaveChangesAsync();
        }

        // 3. Seed Cafe Categories and Cafes
        if (!await context.CafeCategories.AnyAsync(cc => cc.OrganizationId == orgId))
        {
            var category = new CafeCategory
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                OrganizationId = orgId,
                Name = "Kitap Kafe",
                DisplayOrder = 1
            };
            context.CafeCategories.Add(category);

            context.Cafes.AddRange(
                new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    OrganizationId = orgId,
                    CategoryId = category.Id,
                    Name = "Merkez Kitap Kafe",
                    Address = "Gölbaşı Merkez, Ankara",
                    Latitude = 39.7915m,
                    Longitude = 32.8085m,
                    IsActive = true
                },
                new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-444444444444"),
                    OrganizationId = orgId,
                    CategoryId = category.Id,
                    Name = "Mogan Gölü Kitap Kafe",
                    Address = "Mogan Gölü Sahil Yolu, Ankara",
                    Latitude = 39.7825m,
                    Longitude = 32.7955m,
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        // 4. Seed Users
        if (!await context.Users.AnyAsync())
        {
            var adminUser = new User
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                OrganizationId = orgId,
                Email = "admin@golbox.gov.tr",
                NormalizedEmail = "ADMIN@GOLBOX.GOV.TR",
                PasswordHash = passwordHasher.Hash("Admin123!"),
                FirstName = "Mehmet",
                LastName = "Yılmaz",
                PointsBalance = 0
            };

            var testUser = new User
            {
                Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                OrganizationId = orgId,
                Email = "user@golbox.com",
                NormalizedEmail = "USER@GOLBOX.COM",
                PasswordHash = passwordHasher.Hash("User123!"),
                FirstName = "Ahmet",
                LastName = "Kaya",
                PointsBalance = 150 // Give some default points for testing rewards
            };

            context.Users.AddRange(adminUser, testUser);
            await context.SaveChangesAsync();
        }

        // 5. Seed Rewards
        if (!await context.Rewards.AnyAsync(r => r.OrganizationId == orgId))
        {
            context.Rewards.AddRange(
                new Reward
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                    OrganizationId = orgId,
                    Title = "Filtre Kahve",
                    Description = "Sıcak demlenmiş enfes filtre kahve.",
                    RequiredPoints = 50,
                    Status = "Active",
                    ImageUrl = "https://golbox.com/images/filter_coffee.png"
                },
                new Reward
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-666666666666"),
                    OrganizationId = orgId,
                    Title = "Türk Kahvesi",
                    Description = "Geleneksel lezzet, köpüklü Türk Kahvesi.",
                    RequiredPoints = 40,
                    Status = "Active",
                    ImageUrl = "https://golbox.com/images/turkish_coffee.png"
                },
                new Reward
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-777777777777"),
                    OrganizationId = orgId,
                    Title = "Americano",
                    Description = "Espresso bazlı hafif içimli sade kahve.",
                    RequiredPoints = 60,
                    Status = "Active",
                    ImageUrl = "https://golbox.com/images/americano.png"
                }
            );
            await context.SaveChangesAsync();
        }

        // 6. Seed Tasks
        if (!await context.Tasks.AnyAsync(t => t.OrganizationId == orgId))
        {
            context.Tasks.AddRange(
                new GolBox.Domain.Entities.Task
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    OrganizationId = orgId,
                    Title = "İlk Profilini Doldur",
                    Description = "Profil bilgilerini tamamla ve ödül puanları anında kazan.",
                    PointsReward = 25,
                    StartDate = DateTime.UtcNow.AddDays(-5),
                    EndDate = DateTime.UtcNow.AddDays(30),
                    MaxCompletions = 1,
                    Status = "Active"
                },
                new GolBox.Domain.Entities.Task
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-888888888888"),
                    OrganizationId = orgId,
                    Title = "Kitap Kurdu Görevi",
                    Description = "Kitap Kafede bir günde en az 2 saat kitap okuma faaliyeti gerçekleştir.",
                    PointsReward = 35,
                    StartDate = DateTime.UtcNow.AddDays(-2),
                    EndDate = DateTime.UtcNow.AddDays(15),
                    MaxCompletions = 3,
                    Status = "Active"
                }
            );
            await context.SaveChangesAsync();
        }

        // 7. Seed Activities
        if (!await context.Activities.AnyAsync(a => a.OrganizationId == orgId))
        {
            context.Activities.AddRange(
                new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    OrganizationId = orgId,
                    Title = "Mogan Gölü Çevre Temizliği",
                    Description = "Gönüllü çevre temizliği hareketine katıl, doğayı koru ve puan kazan.",
                    PointsReward = 100,
                    Location = "Mogan Gölü Sahil Alanı",
                    StartDate = DateTime.UtcNow.AddDays(1),
                    EndDate = DateTime.UtcNow.AddDays(1).AddHours(4),
                    Status = "Active"
                },
                new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-777777777777"),
                    OrganizationId = orgId,
                    Title = "Gölbaşı Sahil Konseri",
                    Description = "Sahil Parkında düzenlenecek olan gençlik konserinde yerini al.",
                    PointsReward = 50,
                    Location = "Atatürk Sahil Parkı",
                    StartDate = DateTime.UtcNow.AddDays(3),
                    EndDate = DateTime.UtcNow.AddDays(3).AddHours(3),
                    Status = "Active"
                }
            );
            await context.SaveChangesAsync();
        }

        // 8. Seed Menu Items
        if (!await context.MenuItems.AnyAsync())
        {
            context.MenuItems.AddRange(
                new MenuItem
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // Merkez
                    Name = "Türk Kahvesi",
                    Description = "Geleneksel közde pişirilmiş Türk kahvesi.",
                    Price = 40.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                },
                new MenuItem
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // Merkez
                    Name = "Filtre Kahve",
                    Description = "Özenle seçilmiş çekirdeklerden demlenmiş kahve.",
                    Price = 45.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                },
                new MenuItem
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    CafeId = Guid.Parse("33333333-3333-3333-3333-444444444444"), // Mogan
                    Name = "Simit & Peynir",
                    Description = "Çıtır Ankara simidi ve taze kaşar peyniri.",
                    Price = 30.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        // 9. Seed Orders
        if (!await context.Orders.AnyAsync())
        {
            var orderId1 = Guid.Parse("11110000-0000-0000-0000-000000000001");
            var orderId2 = Guid.Parse("22220000-0000-0000-0000-000000000002");
            var orderId3 = Guid.Parse("33330000-0000-0000-0000-000000000003");

            context.Orders.AddRange(
                new Order
                {
                    Id = orderId1,
                    UserId = Guid.Parse("88888888-8888-8888-8888-888888888888"), // Ahmet Kaya
                    CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // Merkez
                    TotalAmount = 85.00m,
                    PaidWithPoints = false,
                    PointsUsed = 0,
                    Status = "Preparing",
                    CollectionCode = "IS-MR-4890",
                    OrganizationId = orgId,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-20)
                },
                new Order
                {
                    Id = orderId2,
                    UserId = Guid.Parse("88888888-8888-8888-8888-888888888888"), // Ahmet Kaya
                    CafeId = Guid.Parse("33333333-3333-3333-3333-444444444444"), // Mogan
                    TotalAmount = 30.00m,
                    PaidWithPoints = true,
                    PointsUsed = 30,
                    Status = "Ready",
                    CollectionCode = "IS-MR-9012",
                    OrganizationId = orgId,
                    CreatedDate = DateTime.UtcNow.AddMinutes(-5)
                },
                new Order
                {
                    Id = orderId3,
                    UserId = Guid.Parse("88888888-8888-8888-8888-888888888888"), // Ahmet Kaya
                    CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // Merkez
                    TotalAmount = 40.00m,
                    PaidWithPoints = false,
                    PointsUsed = 0,
                    Status = "Completed",
                    CollectionCode = "IS-MR-1234",
                    OrganizationId = orgId,
                    CreatedDate = DateTime.UtcNow.AddHours(-3)
                }
            );

            context.OrderItems.AddRange(
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId1,
                    MenuItemId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Türk Kahvesi
                    Quantity = 1,
                    UnitPrice = 40.00m
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId1,
                    MenuItemId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), // Filtre Kahve
                    Quantity = 1,
                    UnitPrice = 45.00m
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId2,
                    MenuItemId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), // Simit & Peynir
                    Quantity = 1,
                    UnitPrice = 30.00m
                },
                new OrderItem
                {
                    Id = Guid.NewGuid(),
                    OrderId = orderId3,
                    MenuItemId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Türk Kahvesi
                    Quantity = 1,
                    UnitPrice = 40.00m
                }
            );

            await context.SaveChangesAsync();
        }
    }
}
