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
        await context.Database.EnsureCreatedAsync();
        await EnsureProviderSchemaAsync(context);

        if (context.Database.IsSqlServer())
        {
            await context.Database.ExecuteSqlRawAsync(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ApprovalRequests')
            BEGIN
                CREATE TABLE [ApprovalRequests] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [RequestType] nvarchar(max) NOT NULL,
                    [RequesterUserId] uniqueidentifier NOT NULL,
                    [RequesterEmail] nvarchar(max) NOT NULL,
                    [BranchId] uniqueidentifier NULL,
                    [TargetEntityId] nvarchar(max) NULL,
                    [OldValue] nvarchar(max) NULL,
                    [NewValue] nvarchar(max) NULL,
                    [Reason] nvarchar(max) NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [ApproverUserId] uniqueidentifier NULL,
                    [ApproverEmail] nvarchar(max) NULL,
                    [ApprovalNote] nvarchar(max) NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AuditLogs')
            BEGIN
                CREATE TABLE [AuditLogs] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [UserId] uniqueidentifier NULL,
                    [UserEmail] nvarchar(max) NOT NULL,
                    [UserRole] nvarchar(max) NOT NULL,
                    [ActionType] nvarchar(max) NOT NULL,
                    [ModuleName] nvarchar(max) NOT NULL,
                    [EntityName] nvarchar(max) NOT NULL,
                    [EntityId] nvarchar(max) NULL,
                    [OldValues] nvarchar(max) NULL,
                    [NewValues] nvarchar(max) NULL,
                    [Reason] nvarchar(max) NULL,
                    [IpAddress] nvarchar(max) NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Campaigns')
            BEGIN
                CREATE TABLE [Campaigns] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [OrganizationId] uniqueidentifier NOT NULL,
                    [Title] nvarchar(max) NOT NULL,
                    [Description] nvarchar(max) NOT NULL,
                    [ImageUrl] nvarchar(max) NULL,
                    [CampaignType] nvarchar(max) NOT NULL,
                    [StartDate] datetime2 NOT NULL,
                    [EndDate] datetime2 NOT NULL,
                    [TargetUserGroup] nvarchar(max) NOT NULL,
                    [CafeId] uniqueidentifier NULL,
                    [MenuItemId] uniqueidentifier NULL,
                    [TotalUsageLimit] int NULL,
                    [PerUserLimit] int NULL,
                    [CurrentUsageCount] int NOT NULL,
                    [IsActive] bit NOT NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
            BEGIN
                CREATE TABLE [Notifications] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [OrganizationId] uniqueidentifier NOT NULL,
                    [Title] nvarchar(max) NOT NULL,
                    [Message] nvarchar(max) NOT NULL,
                    [ImageUrl] nvarchar(max) NULL,
                    [NotificationType] nvarchar(max) NOT NULL,
                    [TargetUserGroup] nvarchar(max) NOT NULL,
                    [TargetUserId] uniqueidentifier NULL,
                    [ScheduledDate] datetime2 NULL,
                    [SentDate] datetime2 NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [SentCount] int NOT NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Coupons')
            BEGIN
                CREATE TABLE [Coupons] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [CouponCode] nvarchar(max) NOT NULL,
                    [UserId] uniqueidentifier NOT NULL,
                    [RewardId] uniqueidentifier NOT NULL,
                    [Status] nvarchar(max) NOT NULL,
                    [ExpiryDate] datetime2 NOT NULL,
                    [UsedCafeId] uniqueidentifier NULL,
                    [UsedDate] datetime2 NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;

            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'StaffUsers')
            BEGIN
                CREATE TABLE [StaffUsers] (
                    [Id] uniqueidentifier NOT NULL PRIMARY KEY,
                    [UserId] uniqueidentifier NOT NULL,
                    [RegistrationNumber] nvarchar(max) NOT NULL,
                    [Role] nvarchar(max) NOT NULL,
                    [BranchId] uniqueidentifier NULL,
                    [IsActive] bit NOT NULL,
                    [LastLoginDate] datetime2 NULL,
                    [CreatedDate] datetime2 NOT NULL,
                    [CreatedBy] uniqueidentifier NULL,
                    [UpdatedDate] datetime2 NULL,
                    [UpdatedBy] uniqueidentifier NULL,
                    [DeletedDate] datetime2 NULL,
                    [DeletedBy] uniqueidentifier NULL,
                    [IsDeleted] bit NOT NULL
                );
            END;
        ");
        }

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
                    Description = "Merkez Kitap Kafe bahçesinde bırakılan saha hediyesi. Yaklaşıp kamerayla al.",
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    RadiusMeters = 40,
                    PointsGranted = 25,
                    TotalStock = 100,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddDays(-1),
                    EndsAt = DateTime.UtcNow.AddDays(60),
                    IsActive = true
                },
                new FieldDrop
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-ddddddddddd2"),
                    OrganizationId = orgId,
                    CafeId = Guid.Parse("33333333-3333-3333-3333-444444444444"),
                    Title = "Şehitkamil Meydan Rozeti",
                    Description = "Belediye meydanına bırakılan 3D rozet. Konuma gelince toplanır.",
                    Latitude = 37.0662m,
                    Longitude = 37.3781m,
                    RadiusMeters = 50,
                    PointsGranted = 40,
                    TotalStock = 50,
                    PerUserLimit = 1,
                    StartsAt = DateTime.UtcNow.AddDays(-1),
                    EndsAt = DateTime.UtcNow.AddDays(60),
                    ModelGlbUrl = "/models/golbox-rozet.glb",
                    IsActive = true
                }
            );
            await context.SaveChangesAsync();
        }

        await EnsurePersonalCouponPolicyAsync(context, orgId);
    }

    private static async System.Threading.Tasks.Task EnsurePersonalCouponPolicyAsync(AppDbContext context, Guid orgId)
    {
        var expireSetting = await context.Settings.FirstOrDefaultAsync(s => s.OrganizationId == orgId && s.Key == "rewardExpireDays");
        if (expireSetting == null)
        {
            context.Settings.Add(new Setting
            {
                OrganizationId = orgId,
                Key = "rewardExpireDays",
                Value = "365",
                Description = "Kişiye özel ikram kuponlarının geçerlilik süresi (gün)"
            });
        }
        else
        {
            expireSetting.Value = "365";
            expireSetting.Description = "Kişiye özel ikram kuponlarının geçerlilik süresi (gün)";
        }

        var claimed = await context.UserRewards.Where(ur => ur.Status == "Claimed").ToListAsync();
        foreach (var ur in claimed)
        {
            var year = ur.ClaimedAt.AddDays(365);
            if (ur.ExpiresAt < year)
                ur.ExpiresAt = year;
        }

        await context.SaveChangesAsync();
    }

    private static async System.Threading.Tasks.Task EnsureProviderSchemaAsync(AppDbContext context)
    {
        if (context.Database.IsSqlServer())
        {
            await context.Database.ExecuteSqlRawAsync(@"
            IF OBJECT_ID('dbo.FieldDrops', 'U') IS NOT NULL AND COL_LENGTH('dbo.FieldDrops', 'RowVersion') IS NULL
            BEGIN
                ALTER TABLE [FieldDrops] ADD [RowVersion] INT NOT NULL CONSTRAINT [DF_FieldDrops_RowVersion] DEFAULT (0);
            END
            ");
            return;
        }

        if (!context.Database.IsSqlite())
            return;

        await AddSqliteColumnIfMissingAsync(context, "Cafes", "ImageUrl", "TEXT");
        await AddSqliteColumnIfMissingAsync(context, "Users", "Role", "TEXT NOT NULL DEFAULT 'User'");
        await AddSqliteColumnIfMissingAsync(context, "FieldDrops", "RowVersion", "INTEGER NOT NULL DEFAULT 0");

        await context.Database.ExecuteSqlRawAsync(@"
            CREATE TABLE IF NOT EXISTS ApprovalRequests (
                Id TEXT NOT NULL PRIMARY KEY,
                RequestType TEXT NOT NULL,
                RequesterUserId TEXT NOT NULL,
                RequesterEmail TEXT NOT NULL,
                BranchId TEXT NULL,
                TargetEntityId TEXT NULL,
                OldValue TEXT NULL,
                NewValue TEXT NULL,
                Reason TEXT NOT NULL,
                Status TEXT NOT NULL,
                ApproverUserId TEXT NULL,
                ApproverEmail TEXT NULL,
                ApprovalNote TEXT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS AuditLogs (
                Id TEXT NOT NULL PRIMARY KEY,
                UserId TEXT NULL,
                UserEmail TEXT NOT NULL,
                UserRole TEXT NOT NULL,
                ActionType TEXT NOT NULL,
                ModuleName TEXT NOT NULL,
                EntityName TEXT NOT NULL,
                EntityId TEXT NULL,
                OldValues TEXT NULL,
                NewValues TEXT NULL,
                Reason TEXT NULL,
                IpAddress TEXT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Campaigns (
                Id TEXT NOT NULL PRIMARY KEY,
                OrganizationId TEXT NOT NULL,
                Title TEXT NOT NULL,
                Description TEXT NOT NULL,
                ImageUrl TEXT NULL,
                CampaignType TEXT NOT NULL,
                StartDate TEXT NOT NULL,
                EndDate TEXT NOT NULL,
                TargetUserGroup TEXT NOT NULL,
                CafeId TEXT NULL,
                MenuItemId TEXT NULL,
                TotalUsageLimit INTEGER NULL,
                PerUserLimit INTEGER NULL,
                CurrentUsageCount INTEGER NOT NULL,
                IsActive INTEGER NOT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Notifications (
                Id TEXT NOT NULL PRIMARY KEY,
                OrganizationId TEXT NOT NULL,
                Title TEXT NOT NULL,
                Message TEXT NOT NULL,
                ImageUrl TEXT NULL,
                NotificationType TEXT NOT NULL,
                TargetUserGroup TEXT NOT NULL,
                TargetUserId TEXT NULL,
                ScheduledDate TEXT NULL,
                SentDate TEXT NULL,
                Status TEXT NOT NULL,
                SentCount INTEGER NOT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS Coupons (
                Id TEXT NOT NULL PRIMARY KEY,
                CouponCode TEXT NOT NULL,
                UserId TEXT NOT NULL,
                RewardId TEXT NOT NULL,
                Status TEXT NOT NULL,
                ExpiryDate TEXT NOT NULL,
                UsedCafeId TEXT NULL,
                UsedDate TEXT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS StaffUsers (
                Id TEXT NOT NULL PRIMARY KEY,
                UserId TEXT NOT NULL,
                RegistrationNumber TEXT NOT NULL,
                Role TEXT NOT NULL,
                BranchId TEXT NULL,
                IsActive INTEGER NOT NULL,
                LastLoginDate TEXT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS FieldDrops (
                Id TEXT NOT NULL PRIMARY KEY,
                OrganizationId TEXT NOT NULL,
                CafeId TEXT NULL,
                CatalogRewardId TEXT NULL,
                Title TEXT NOT NULL,
                Description TEXT NOT NULL,
                Latitude TEXT NOT NULL,
                Longitude TEXT NOT NULL,
                RadiusMeters INTEGER NOT NULL,
                PointsGranted INTEGER NOT NULL,
                TotalStock INTEGER NULL,
                CapturedCount INTEGER NOT NULL,
                PerUserLimit INTEGER NOT NULL,
                StartsAt TEXT NOT NULL,
                EndsAt TEXT NOT NULL,
                ImageUrl TEXT NULL,
                ModelGlbUrl TEXT NULL,
                IsActive INTEGER NOT NULL,
                RowVersion INTEGER NOT NULL DEFAULT 0,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS UserFieldCaptures (
                Id TEXT NOT NULL PRIMARY KEY,
                OrganizationId TEXT NOT NULL,
                FieldDropId TEXT NOT NULL,
                UserId TEXT NOT NULL,
                CapturedLatitude TEXT NOT NULL,
                CapturedLongitude TEXT NOT NULL,
                AccuracyMeters REAL NULL,
                PointsGranted INTEGER NOT NULL,
                DistanceMeters REAL NOT NULL,
                CreatedDate TEXT NOT NULL,
                CreatedBy TEXT NULL,
                UpdatedDate TEXT NULL,
                UpdatedBy TEXT NULL,
                DeletedDate TEXT NULL,
                DeletedBy TEXT NULL,
                IsDeleted INTEGER NOT NULL
            );
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            UPDATE FieldDrops
            SET ModelGlbUrl = '/models/golbox-rozet.glb'
            WHERE lower(Id) = 'dddddddd-dddd-dddd-dddd-ddddddddddd2'
              AND (ModelGlbUrl IS NULL OR ModelGlbUrl = '');
        ");
    }

    private static async System.Threading.Tasks.Task AddSqliteColumnIfMissingAsync(
        AppDbContext context,
        string table,
        string column,
        string definition)
    {
        await context.Database.OpenConnectionAsync();
        try
        {
            var connection = context.Database.GetDbConnection();
            await using var command = connection.CreateCommand();
            command.CommandText = $"PRAGMA table_info({table})";
            var exists = false;
            await using (var reader = await command.ExecuteReaderAsync())
            {
                while (await reader.ReadAsync())
                {
                    var name = reader["name"]?.ToString();
                    if (string.Equals(name, column, StringComparison.OrdinalIgnoreCase))
                    {
                        exists = true;
                        break;
                    }
                }
            }

            if (!exists)
            {
#pragma warning disable EF1002
                await context.Database.ExecuteSqlRawAsync($"ALTER TABLE \"{table}\" ADD COLUMN \"{column}\" {definition}");
#pragma warning restore EF1002
            }
        }
        finally
        {
            await context.Database.CloseConnectionAsync();
        }
    }
}
