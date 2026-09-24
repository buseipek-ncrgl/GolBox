using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using GolBox.Application.Interfaces;
using GolBox.Application.Places;
using GolBox.Domain.Entities;

namespace GolBox.Persistence.Context;

public static class DbInitializer
{
    public static async System.Threading.Tasks.Task SeedAsync(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        bool isDevelopment = false,
        string? bootstrapAdminEmail = null,
        string? bootstrapAdminPassword = null)
    {
        // Schema is applied exclusively via EF Core migrations (Database.Migrate).

        // 1. Seed Organization
        if (!await context.Organizations.AnyAsync())
        {
            var organization = new Organization
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "Gaziantep Şehitkamil Belediyesi",
                ThemeColor = "#1d5f60",
                LogoUrl = null,
                TimeZone = "Europe/Istanbul"
            };
            context.Organizations.Add(organization);
            await context.SaveChangesAsync();
        }

        var orgId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var existingOrg = await context.Organizations.FindAsync(orgId);
        if (existingOrg != null)
        {
            if (existingOrg.Name != "Gaziantep Şehitkamil Belediyesi")
            {
                existingOrg.Name = "Gaziantep Şehitkamil Belediyesi";
                existingOrg.ThemeColor = "#1d5f60";
            }

            if (!string.IsNullOrWhiteSpace(existingOrg.LogoUrl) &&
                existingOrg.LogoUrl.Contains("golbasi", StringComparison.OrdinalIgnoreCase))
            {
                existingOrg.LogoUrl = null;
            }

            await context.SaveChangesAsync();
        }

        // 2. Seed Settings
        if (!await context.Settings.AnyAsync(s => s.OrganizationId == orgId))
        {
            context.Settings.AddRange(
                new Setting { OrganizationId = orgId, Key = "rewardExpireDays", Value = "365", Description = "Kişiye özel ikram kuponlarının geçerlilik süresi (gün)" },
                new Setting { OrganizationId = orgId, Key = "visitBonusPoints", Value = "15", Description = "QR okutma başına verilen ziyaret bonus puanı" },
                new Setting { OrganizationId = orgId, Key = "pointsExchangeRate", Value = "1", Description = "1 TL ödeme için harcanacak puan oranı (1 TL = 1 Puan)" },
                new Setting { OrganizationId = orgId, Key = "spendEarnRatePercent", Value = "10", Description = "Nakit harcamalarda geri kazanılan puan oranı (%)" }
            );
            await context.SaveChangesAsync();
        }

        await EnsureMissingSettingsAsync(context, orgId);
        await TryBootstrapAdminAsync(context, passwordHasher, orgId, bootstrapAdminEmail, bootstrapAdminPassword);

        if (isDevelopment)
        {
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
                    Address = "İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep",
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    ImageUrl = "/cafes/golkafe-merkez.png",
                    IsActive = true
                },
                new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-444444444444"),
                    OrganizationId = orgId,
                    CategoryId = category.Id,
                    Name = "Şehitkamil Gençlik Kitap Kafe",
                    Address = "Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep",
                    Latitude = 37.0662m,
                    Longitude = 37.3781m,
                    ImageUrl = "/cafes/golkafe-sahil.png",
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
                PointsBalance = 0,
                Role = "Admin"
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
                PointsBalance = 150,
                Age = 16,
                EducationLevel = "Lise",
                Role = "User"
            };

            var staffUser = new User
            {
                Id = Guid.Parse("77777777-7777-7777-7777-999999999999"),
                OrganizationId = orgId,
                Email = "staff@golbox.gov.tr",
                NormalizedEmail = "STAFF@GOLBOX.GOV.TR",
                PasswordHash = passwordHasher.Hash("Staff123!"),
                FirstName = "Ayşe",
                LastName = "Demir",
                PointsBalance = 0,
                Role = "Staff"
            };

            context.Users.AddRange(adminUser, testUser, staffUser);
            await context.SaveChangesAsync();
        }
        else
        {
            var admin = await context.Users.FirstOrDefaultAsync(u => u.Email == "admin@golbox.gov.tr");
            if (admin != null && admin.Role != "Admin")
            {
                admin.Role = "Admin";
            }

            var hasStaff = await context.Users.AnyAsync(u => u.Email == "staff@golbox.gov.tr");
            if (!hasStaff)
            {
                context.Users.Add(new User
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-999999999999"),
                    OrganizationId = orgId,
                    Email = "staff@golbox.gov.tr",
                    NormalizedEmail = "STAFF@GOLBOX.GOV.TR",
                    PasswordHash = passwordHasher.Hash("Staff123!"),
                    FirstName = "Ayşe",
                    LastName = "Demir",
                    PointsBalance = 0,
                    Role = "Staff"
                });
            }

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
                    Title = "Şehitkamil Açık Hava Konseri",
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
                    IsActive = true,
                    MinAge = 14,
                    MaxAge = 18,
                    RequiredEducation = "Lise"
                }
            );
            await context.SaveChangesAsync();
        }

        // Force update existing seed data with eligibility conditions if not set
        var simit = await context.MenuItems.FindAsync(Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"));
        if (simit != null && (!simit.MinAge.HasValue || simit.RequiredEducation != "Lise"))
        {
            simit.MinAge = 14;
            simit.MaxAge = 18;
            simit.RequiredEducation = "Lise";
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

        if (!await context.FieldDrops.AnyAsync(d => d.OrganizationId == orgId))
        {
            context.FieldDrops.AddRange(
                new FieldDrop
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddd1"),
                    OrganizationId = orgId,
                    CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    Title = "Merkez Kitap Kafe GölPuan Kutusu",
                    Description = "Merkez Kitap Kafe bahçesinde bırakılan 3D kahve hediyesi.",
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    RadiusMeters = 500,
                    PointsGranted = 50,
                    TotalStock = 100,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddDays(-1),
                    EndsAt = DateTime.UtcNow.AddDays(365),
                    IsActive = true
                },
                new FieldDrop
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddd2"),
                    OrganizationId = orgId,
                    CafeId = Guid.Parse("33333333-3333-3333-3333-444444444444"),
                    Title = "Şehitkamil Gençlik Parkı 3D Kahve Hediyesi",
                    Description = "Atatürk Mah. Gençlik Parkı İçinde Süzülen 3D Pipetli Soğuk Kahve Bardağı",
                    Latitude = 37.0662m,
                    Longitude = 37.3781m,
                    RadiusMeters = 500,
                    PointsGranted = 50,
                    TotalStock = 50,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddDays(-1),
                    EndsAt = DateTime.UtcNow.AddDays(365),
                    IsActive = true
                },
                new FieldDrop
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddd3"),
                    OrganizationId = orgId,
                    Title = "Dülük Tabiat Parkı Doğa Hediyesi",
                    Description = "Dülük Köyü Gençlik Kampı Yürüyüş Yolu",
                    Latitude = 37.0921m,
                    Longitude = 37.3510m,
                    RadiusMeters = 500,
                    PointsGranted = 100,
                    TotalStock = 50,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddDays(-1),
                    EndsAt = DateTime.UtcNow.AddDays(365),
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        await SeedDevelopmentCityContentAsync(context);
        }

        await LinkExistingCafesToPlacesAsync(context);
    }

    private static async System.Threading.Tasks.Task EnsureMissingSettingsAsync(AppDbContext context, Guid orgId)
    {
        var defaults = new (string Key, string Value, string Description)[]
        {
            ("rewardExpireDays", "365", "Kişiye özel ikram kuponlarının geçerlilik süresi (gün)"),
            ("visitBonusPoints", "15", "QR okutma başına verilen ziyaret bonus puanı"),
            ("pointsExchangeRate", "1", "1 TL ödeme için harcanacak puan oranı (1 TL = 1 Puan)"),
            ("spendEarnRatePercent", "10", "Nakit harcamalarda geri kazanılan puan oranı (%)")
        };

        foreach (var (key, value, description) in defaults)
        {
            var exists = await context.Settings.AnyAsync(s => s.OrganizationId == orgId && s.Key == key);
            if (!exists)
            {
                context.Settings.Add(new Setting
                {
                    OrganizationId = orgId,
                    Key = key,
                    Value = value,
                    Description = description
                });
            }
        }

        await context.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task TryBootstrapAdminAsync(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        Guid orgId,
        string? email,
        string? password)
    {
        if (await context.Users.AnyAsync(u => u.Role == "Admin"))
            return;

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return;

        if (password.Length < 12)
            throw new InvalidOperationException("BootstrapAdmin:Password must be at least 12 characters.");

        context.Users.Add(new User
        {
            OrganizationId = orgId,
            Email = email.Trim(),
            NormalizedEmail = email.Trim().ToUpperInvariant(),
            PasswordHash = passwordHasher.Hash(password),
            FirstName = "Sistem",
            LastName = "Yöneticisi",
            PointsBalance = 0,
            Role = "Admin"
        });
        await context.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task LinkExistingCafesToPlacesAsync(AppDbContext context)
    {
        var cafes = await context.Cafes.ToListAsync();
        foreach (var cafe in cafes)
            await PlaceCafeSync.EnsureLinkedPlaceAsync(context, cafe);
        if (cafes.Count > 0)
            await context.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task SeedDevelopmentCityContentAsync(AppDbContext context)
    {
        if (await context.CityContents.AnyAsync())
            return;

        var orgId = await context.Organizations.Select(o => o.Id).FirstOrDefaultAsync();
        if (orgId == Guid.Empty)
            return;

        var now = DateTime.UtcNow;
        context.CityContents.Add(new CityContent
        {
            Id = Guid.Parse("c1111111-1111-1111-1111-111111111111"),
            OrganizationId = orgId,
            Type = "Hero",
            Title = "Şehitkamil Sanat Merkezi Yaz Kursları Başladı",
            Subtitle = "Müzik, resim, tiyatro ve teknoloji eğitimleri için kayıtlar devam ediyor.",
            Body = "Şehitkamil Belediyesi Sanat Merkezi bünyesinde açılan yaz sanat ve teknoloji kurslarına kayıtlar online olarak yapılmaktadır.",
            ImageUrl = "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
            CtaLabel = "Detayı Gör",
            CtaType = "InternalRoute",
            CtaTarget = "home",
            Priority = 10,
            StartAt = now.AddDays(-1),
            EndAt = now.AddYears(1),
            IsPublished = true,
            AudienceType = "Everyone"
        });
        context.CityContents.Add(new CityContent
        {
            Id = Guid.Parse("c2222222-2222-2222-2222-222222222222"),
            OrganizationId = orgId,
            Type = "Hero",
            Title = "Gençlik Kütüphanesi 24 Saat Hizmetinizde",
            Subtitle = "Geniş kaynakları ve sessiz çalışma alanlarıyla sınav maratonunda yanınızdayız.",
            Body = "24 saat açık kütüphanemizde tüm öğrencilerimize ücretsiz sıcak ikramlar sunulmaktadır.",
            ImageUrl = "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=800&auto=format&fit=crop&q=80",
            CtaLabel = "Konumu Gör",
            CtaType = "Map",
            CtaTarget = "map",
            Priority = 20,
            StartAt = now.AddDays(-1),
            EndAt = now.AddYears(1),
            IsPublished = true,
            AudienceType = "Everyone"
        });
        context.CityContents.Add(new CityContent
        {
            Id = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
            OrganizationId = orgId,
            Type = "Hero",
            Title = "Dülük Tabiat Parkı Gençlik Doğa Yürüyüşü",
            Subtitle = "Sağlıklı yaşam ve sıfır atık doğa buluşmasına tüm gençlerimiz davetlidir.",
            Body = "Etkinliğe katılan tüm genç sporseverlere +100 GP hediye puan verilecektir.",
            ImageUrl = "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
            CtaLabel = "Katıl ve Puan Kazan",
            CtaType = "InternalRoute",
            CtaTarget = "earn",
            Priority = 30,
            StartAt = now.AddDays(-1),
            EndAt = now.AddYears(1),
            IsPublished = true,
            AudienceType = "Everyone"
        });
        await context.SaveChangesAsync();
    }

}
