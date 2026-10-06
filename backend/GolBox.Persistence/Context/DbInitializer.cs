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
    public static async System.Threading.Tasks.Task ResetTestDataAsync(AppDbContext context)
    {
        // Execute raw SQL DELETE statements to bypass EF Core soft-delete interceptor and clean physical rows
        await context.Database.ExecuteSqlRawAsync("DELETE FROM UserNotifications;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Notifications;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM UserTasks;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM UserActivities;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM UserRewards;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM UserFieldCaptures;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM PointTransactions;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM QrPayments;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM RefreshTokens;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM OrderItems;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Orders;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM FieldDrops;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Coupons;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Campaigns;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Tasks;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Activities;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Rewards;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM MenuItems;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Places;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Cafes;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM CafeCategories;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM CityContents;");
        await context.Database.ExecuteSqlRawAsync("DELETE FROM Users;");

        context.ChangeTracker.Clear();
    }

    public static async System.Threading.Tasks.Task SeedAsync(
        AppDbContext context,
        IPasswordHasher passwordHasher,
        bool isDevelopment = false,
        bool forceRefresh = false,
        string? bootstrapAdminEmail = null,
        string? bootstrapAdminPassword = null)
    {
        // Schema is applied exclusively via EF Core migrations (Database.Migrate).

        // 0. Perform Clean Test Reset if requested in Development
        if (isDevelopment && forceRefresh)
        {
            await ResetTestDataAsync(context);
        }

        // 1. Seed Organization
        var orgId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        if (!await context.Organizations.AnyAsync())
        {
            var organization = new Organization
            {
                Id = orgId,
                Name = "Gaziantep Şehitkamil Belediyesi",
                ThemeColor = "#1d5f60",
                LogoUrl = null,
                TimeZone = "Europe/Istanbul"
            };
            context.Organizations.Add(organization);
            await context.SaveChangesAsync();
        }

        var existingOrg = await context.Organizations.FindAsync(orgId);
        if (existingOrg != null)
        {
            if (existingOrg.Name != "Gaziantep Şehitkamil Belediyesi")
            {
                existingOrg.Name = "Gaziantep Şehitkamil Belediyesi";
                existingOrg.ThemeColor = "#1d5f60";
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
            // 3. Seed Cafe Categories and Cafes (Branches)
            if (!await context.CafeCategories.AnyAsync(cc => cc.OrganizationId == orgId))
            {
                var catKitap = new CafeCategory { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), OrganizationId = orgId, Name = "Kitap Kafe", DisplayOrder = 1 };
                var catKahve = new CafeCategory { Id = Guid.Parse("22222222-2222-2222-2222-333333333333"), OrganizationId = orgId, Name = "Kahveler", DisplayOrder = 2 };
                var catSoguk = new CafeCategory { Id = Guid.Parse("22222222-2222-2222-2222-444444444444"), OrganizationId = orgId, Name = "Soğuk İçecekler", DisplayOrder = 3 };
                var catCay = new CafeCategory { Id = Guid.Parse("22222222-2222-2222-2222-555555555555"), OrganizationId = orgId, Name = "Çaylar", DisplayOrder = 4 };
                var catAtistirma = new CafeCategory { Id = Guid.Parse("22222222-2222-2222-2222-666666666666"), OrganizationId = orgId, Name = "Atıştırmalıklar", DisplayOrder = 5 };

                context.CafeCategories.AddRange(catKitap, catKahve, catSoguk, catCay, catAtistirma);

                // Branch 1: Şehitkamil Kitap Kafe (Normal, Active, Gel-Al Open)
                var cafe1 = new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                    OrganizationId = orgId,
                    CategoryId = catKitap.Id,
                    Name = "Şehitkamil Kitap Kafe",
                    Address = "İncilipınar Mah. Muammer Aksoy Bulv. No:12, Şehitkamil / Gaziantep",
                    Latitude = 37.0750m,
                    Longitude = 37.3825m,
                    ImageUrl = "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80",
                    IsActive = true
                };

                // Branch 2: GölBOX Test Şubesi 2 (Active, Gel-Al Paused)
                var cafe2 = new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-444444444444"),
                    OrganizationId = orgId,
                    CategoryId = catKitap.Id,
                    Name = "GölBOX Test Şubesi 2",
                    Address = "Atatürk Mah. 15. Sok. No:4, Şehitkamil / Gaziantep",
                    Latitude = 37.0662m,
                    Longitude = 37.3781m,
                    ImageUrl = "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80",
                    IsActive = true
                };

                // Branch 3: GölBOX Test Şubesi 3 (Closed)
                var cafe3 = new Cafe
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-555555555555"),
                    OrganizationId = orgId,
                    CategoryId = catKitap.Id,
                    Name = "GölBOX Test Şubesi 3",
                    Address = "Dülük Mah. 1. Sok. No:8, Şehitkamil / Gaziantep",
                    Latitude = 37.0921m,
                    Longitude = 37.3510m,
                    ImageUrl = "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80",
                    IsActive = false
                };

                context.Cafes.AddRange(cafe1, cafe2, cafe3);
                await context.SaveChangesAsync();
            }

            // 4. Seed Deterministic Test Users
            if (!await context.Users.AnyAsync(u => u.Email == "customer.clean@golbox.com"))
            {
                var adminUser = new User
                {
                    Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                    OrganizationId = orgId,
                    Email = "admin@golbox.gov.tr",
                    NormalizedEmail = "ADMIN@GOLBOX.GOV.TR",
                    PasswordHash = passwordHasher.Hash("Admin123!"),
                    FirstName = "TEST Admin",
                    LastName = "Yılmaz",
                    PointsBalance = 0,
                    Role = "Admin"
                };

                var cleanCustomer = new User
                {
                    Id = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                    OrganizationId = orgId,
                    Email = "customer.clean@golbox.com",
                    NormalizedEmail = "CUSTOMER.CLEAN@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Clean123!"),
                    FirstName = "TEST Customer",
                    LastName = "Clean",
                    PointsBalance = 0,
                    Role = "User"
                };

                var loyaltyCustomer = new User
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    OrganizationId = orgId,
                    Email = "customer.loyalty@golbox.com",
                    NormalizedEmail = "CUSTOMER.LOYALTY@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Loyal123!"),
                    FirstName = "TEST Customer",
                    LastName = "Loyalty",
                    PointsBalance = 340,
                    Age = 24,
                    EducationLevel = "Üniversite",
                    Role = "User"
                };

                var legacyAhmet = new User
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-777777777777"),
                    OrganizationId = orgId,
                    Email = "ahmet.yilmaz@sehitkamil.bel.tr",
                    NormalizedEmail = "AHMET.YILMAZ@SEHITKAMIL.BEL.TR",
                    PasswordHash = passwordHasher.Hash("123456"),
                    FirstName = "Ahmet",
                    LastName = "Yılmaz",
                    PointsBalance = 340,
                    Age = 24,
                    EducationLevel = "Üniversite",
                    Role = "User"
                };

                var lowCustomer = new User
                {
                    Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                    OrganizationId = orgId,
                    Email = "customer.low@golbox.com",
                    NormalizedEmail = "CUSTOMER.LOW@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Low123!"),
                    FirstName = "TEST Customer",
                    LastName = "LowPoints",
                    PointsBalance = 39,
                    Role = "User"
                };

                var exactCustomer = new User
                {
                    Id = Guid.Parse("33333333-3333-3333-3333-111111111111"),
                    OrganizationId = orgId,
                    Email = "customer.exact@golbox.com",
                    NormalizedEmail = "CUSTOMER.EXACT@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Exact123!"),
                    FirstName = "TEST Customer",
                    LastName = "ExactPoints",
                    PointsBalance = 40,
                    Role = "User"
                };

                var activeOrderCustomer = new User
                {
                    Id = Guid.Parse("22222222-2222-2222-2222-111111111111"),
                    OrganizationId = orgId,
                    Email = "customer.active@golbox.com",
                    NormalizedEmail = "CUSTOMER.ACTIVE@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Active123!"),
                    FirstName = "TEST Customer",
                    LastName = "ActiveOrder",
                    PointsBalance = 100,
                    Role = "User"
                };

                var eventCustomer = new User
                {
                    Id = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                    OrganizationId = orgId,
                    Email = "customer.event@golbox.com",
                    NormalizedEmail = "CUSTOMER.EVENT@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Event123!"),
                    FirstName = "TEST Customer",
                    LastName = "EventUser",
                    PointsBalance = 50,
                    Role = "User"
                };

                var missionCustomer = new User
                {
                    Id = Guid.Parse("55555555-5555-5555-5555-444444444444"),
                    OrganizationId = orgId,
                    Email = "customer.mission@golbox.com",
                    NormalizedEmail = "CUSTOMER.MISSION@GOLBOX.COM",
                    PasswordHash = passwordHasher.Hash("Mission123!"),
                    FirstName = "TEST Customer",
                    LastName = "MissionUser",
                    PointsBalance = 150,
                    Age = 20,
                    EducationLevel = "Üniversite",
                    Role = "User"
                };

                var staffUser = new User
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-999999999999"),
                    OrganizationId = orgId,
                    Email = "staff.branch1@golbox.gov.tr",
                    NormalizedEmail = "STAFF.BRANCH1@GOLBOX.GOV.TR",
                    PasswordHash = passwordHasher.Hash("Staff123!"),
                    FirstName = "TEST Branch",
                    LastName = "Staff",
                    PointsBalance = 0,
                    Role = "Staff"
                };

                var managerUser = new User
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-888888888888"),
                    OrganizationId = orgId,
                    Email = "manager.branch1@golbox.gov.tr",
                    NormalizedEmail = "MANAGER.BRANCH1@GOLBOX.GOV.TR",
                    PasswordHash = passwordHasher.Hash("Manager123!"),
                    FirstName = "TEST Branch",
                    LastName = "Manager",
                    PointsBalance = 0,
                    Role = "Staff"
                };

                context.Users.AddRange(adminUser, cleanCustomer, loyaltyCustomer, legacyAhmet, lowCustomer, exactCustomer, activeOrderCustomer, eventCustomer, missionCustomer, staffUser, managerUser);
                await context.SaveChangesAsync();

                // Seed PointTransactions (Ledger) for 340 GP, 39 GP, 40 GP users
                context.PointTransactions.AddRange(
                    new PointTransaction { Id = Guid.NewGuid(), UserId = loyaltyCustomer.Id, OrganizationId = orgId, Amount = 100, Type = "Earn", Description = "Sipariş Kazanımı #GB-1001", ReferenceType = "Order" },
                    new PointTransaction { Id = Guid.NewGuid(), UserId = loyaltyCustomer.Id, OrganizationId = orgId, Amount = 100, Type = "Earn", Description = "Sipariş Kazanımı #GB-1002", ReferenceType = "Order" },
                    new PointTransaction { Id = Guid.NewGuid(), UserId = loyaltyCustomer.Id, OrganizationId = orgId, Amount = 100, Type = "Earn", Description = "Mogan Gölü Çevre Temizliği Etkinlik Ödülü", ReferenceType = "Event" },
                    new PointTransaction { Id = Guid.NewGuid(), UserId = loyaltyCustomer.Id, OrganizationId = orgId, Amount = 40, Type = "Earn", Description = "Profil Tamamlama Görev Ödülü", ReferenceType = "Task" },
                    new PointTransaction { Id = Guid.NewGuid(), UserId = lowCustomer.Id, OrganizationId = orgId, Amount = 39, Type = "Earn", Description = "Sipariş Kazanımı #GB-1000", ReferenceType = "Order" },
                    new PointTransaction { Id = Guid.NewGuid(), UserId = exactCustomer.Id, OrganizationId = orgId, Amount = 40, Type = "Earn", Description = "Sipariş Kazanımı #GB-1000", ReferenceType = "Order" }
                );
                await context.SaveChangesAsync();
            }

            // 5. Seed Rewards
            if (!await context.Rewards.AnyAsync(r => r.OrganizationId == orgId))
            {
                context.Rewards.AddRange(
                    new Reward
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-666666666666"),
                        OrganizationId = orgId,
                        Title = "Türk Kahvesi İkramı",
                        Description = "Geleneksel köpüklü Türk kahvesi ikram kuponu.",
                        RequiredPoints = 40,
                        Status = "Active",
                        ImageUrl = "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60"
                    },
                    new Reward
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                        OrganizationId = orgId,
                        Title = "Filtre Kahve İkramı",
                        Description = "Demleme filtre kahve ikram kuponu.",
                        RequiredPoints = 50,
                        Status = "Active",
                        ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60"
                    },
                    new Reward
                    {
                        Id = Guid.Parse("55555555-5555-5555-5555-777777777777"),
                        OrganizationId = orgId,
                        Title = "Americano İkramı",
                        Description = "Espresso bazlı sade kahve kuponu.",
                        RequiredPoints = 60,
                        Status = "Active",
                        ImageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60"
                    }
                );
                await context.SaveChangesAsync();
            }

            // 6. Seed Tasks (Missions)
            if (!await context.Tasks.AnyAsync(t => t.OrganizationId == orgId))
            {
                var task1 = new GolBox.Domain.Entities.Task
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-777777777777"),
                    OrganizationId = orgId,
                    Title = "İlk Kahveni Yudumla",
                    Description = "Herhangi bir Kitap Kafemizde ilk siparişini tamamla.",
                    PointsReward = 25,
                    StartDate = DateTime.UtcNow.AddDays(-5),
                    EndDate = DateTime.UtcNow.AddDays(30),
                    MaxCompletions = 1,
                    Status = "Active"
                };

                var task2 = new GolBox.Domain.Entities.Task
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-888888888888"),
                    OrganizationId = orgId,
                    Title = "Haftalık Kitap Okuma Görevi",
                    Description = "Kitap Kafede bir haftada 3 kez vakit geçir ve sipariş ver.",
                    PointsReward = 35,
                    StartDate = DateTime.UtcNow.AddDays(-2),
                    EndDate = DateTime.UtcNow.AddDays(15),
                    MaxCompletions = 3,
                    Status = "Active"
                };

                var taskExpired = new GolBox.Domain.Entities.Task
                {
                    Id = Guid.Parse("77777777-7777-7777-7777-000000000000"),
                    OrganizationId = orgId,
                    Title = "Eski Dönem Kitap Görevi",
                    Description = "Süresi dolmuş geçmiş test görevi.",
                    PointsReward = 50,
                    StartDate = DateTime.UtcNow.AddDays(-60),
                    EndDate = DateTime.UtcNow.AddDays(-5),
                    MaxCompletions = 1,
                    Status = "Expired"
                };

                context.Tasks.AddRange(task1, task2, taskExpired);
                await context.SaveChangesAsync();

                // Seed Task progress for Customer Mission User (2/3)
                context.UserTasks.Add(new UserTask
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    UserId = Guid.Parse("55555555-5555-5555-5555-444444444444"),
                    TaskId = task2.Id,
                    CompletedAt = DateTime.UtcNow.AddDays(-1),
                    PointsEarned = 0
                });
                await context.SaveChangesAsync();
            }

            // 7. Seed Activities (Events)
            if (!await context.Activities.AnyAsync(a => a.OrganizationId == orgId))
            {
                var eventA = new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                    OrganizationId = orgId,
                    Title = "Şehitkamil Gençlik Doğa Yürüyüşü",
                    Description = "Sağlıklı yaşam için Dülük Tabiat Parkı'nda gençlik doğa yürüyüşü.",
                    PointsReward = 100,
                    Location = "Dülük Tabiat Parkı Yürüyüş Yolu",
                    StartDate = DateTime.UtcNow.AddDays(2),
                    EndDate = DateTime.UtcNow.AddDays(2).AddHours(4),
                    Status = "Active"
                };

                var eventB = new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-777777777777"),
                    OrganizationId = orgId,
                    Title = "Mogan Gölü Çevre Temizliği",
                    Description = "Gönüllü çevre temizliği hareketi ve doğa farkındalık çalışması.",
                    PointsReward = 50,
                    Location = "Mogan Gölü Sahil Parkı",
                    StartDate = DateTime.UtcNow.AddDays(4),
                    EndDate = DateTime.UtcNow.AddDays(4).AddHours(3),
                    Status = "Active"
                };

                var eventD = new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-999999999999"),
                    OrganizationId = orgId,
                    Title = "Gençlik Fotoğrafçılık Atölyesi",
                    Description = "Tamamlanan tematik fotoğrafçılık eğitimi.",
                    PointsReward = 75,
                    Location = "Şehitkamil Kültür Kongre Merkezi",
                    StartDate = DateTime.UtcNow.AddDays(-10),
                    EndDate = DateTime.UtcNow.AddDays(-10).AddHours(2),
                    Status = "Completed"
                };

                var eventE = new Activity
                {
                    Id = Guid.Parse("66666666-6666-6666-6666-000000000000"),
                    OrganizationId = orgId,
                    Title = "İptal Edilen Bahar Şenliği",
                    Description = "Olumsuz hava koşulları nedeniyle iptal edilen etkinlik.",
                    PointsReward = 0,
                    Location = "Atatürk Sahil Parkı",
                    StartDate = DateTime.UtcNow.AddDays(10),
                    EndDate = DateTime.UtcNow.AddDays(10).AddHours(5),
                    Status = "Cancelled"
                };

                context.Activities.AddRange(eventA, eventB, eventD, eventE);
                await context.SaveChangesAsync();

                // Seed user event registration for Event B (customer.event@golbox.com)
                context.UserActivities.Add(new UserActivity
                {
                    Id = Guid.NewGuid(),
                    OrganizationId = orgId,
                    UserId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
                    ActivityId = eventB.Id,
                    JoinedAt = DateTime.UtcNow.AddHours(-12),
                    PointsEarned = 0
                });
                await context.SaveChangesAsync();
            }

            // 8. Seed Campaigns
            if (!await context.Campaigns.AnyAsync(c => c.OrganizationId == orgId))
            {
                context.Campaigns.AddRange(
                    new Campaign
                    {
                        Id = Guid.Parse("c1111111-1111-1111-1111-111111111111"),
                        OrganizationId = orgId,
                        Title = "Yaz Kahve Festivali",
                        Description = "Tüm soğuk kahvelerde 2.si %50 indirimli!",
                        ImageUrl = "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=800&auto=format&fit=crop&q=80",
                        StartDate = DateTime.UtcNow.AddDays(-5),
                        EndDate = DateTime.UtcNow.AddDays(30),
                        IsActive = true
                    },
                    new Campaign
                    {
                        Id = Guid.Parse("c2222222-2222-2222-2222-222222222222"),
                        OrganizationId = orgId,
                        Title = "Sonbahar Kitap Günleri",
                        Description = "Gelecek ay başlayacak özel kitap kafe promosyonu.",
                        ImageUrl = "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=800&auto=format&fit=crop&q=80",
                        StartDate = DateTime.UtcNow.AddDays(15),
                        EndDate = DateTime.UtcNow.AddDays(45),
                        IsActive = true
                    },
                    new Campaign
                    {
                        Id = Guid.Parse("c3333333-3333-3333-3333-333333333333"),
                        OrganizationId = orgId,
                        Title = "Geçen Sezon Bahar Kampanyası",
                        Description = "Süresi dolmuş kampanya kaydı.",
                        ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop&q=80",
                        StartDate = DateTime.UtcNow.AddDays(-60),
                        EndDate = DateTime.UtcNow.AddDays(-10),
                        IsActive = false
                    }
                );
                await context.SaveChangesAsync();
            }

            // 9. Seed Menu Items
            if (!await context.MenuItems.AnyAsync())
            {
                var cafeId = Guid.Parse("33333333-3333-3333-3333-333333333333");

                var item1 = new MenuItem
                {
                    Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                    CafeId = cafeId,
                    Name = "Türk Kahvesi",
                    Description = "Geleneksel közde pişirilmiş köpüklü Türk kahvesi.",
                    Price = 40.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                };

                var item2 = new MenuItem
                {
                    Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                    CafeId = cafeId,
                    Name = "Filtre Kahve",
                    Description = "Özenle seçilmiş çekirdeklerden demlenmiş sıcak filtre kahve.",
                    Price = 45.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                };

                var item3 = new MenuItem
                {
                    Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                    CafeId = cafeId,
                    Name = "Americano",
                    Description = "Espresso bazlı hafif içimli sıcak sade kahve.",
                    Price = 50.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                };

                var item4 = new MenuItem
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                    CafeId = cafeId,
                    Name = "Latte",
                    Description = "Zengin espresso ve kadifemsi sıcak süt köpüğü.",
                    Price = 55.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=500&auto=format&fit=crop&q=60",
                    IsActive = true
                };

                var itemDisabled = new MenuItem
                {
                    Id = Guid.Parse("11112222-3333-4444-5555-666677778888"),
                    CafeId = cafeId,
                    Name = "Geçici Olarak Temin Edilemeyen Ürün",
                    Description = "Stokta bulunmayan test ürünü.",
                    Price = 35.00m,
                    ImageUrl = "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500&auto=format&fit=crop&q=60",
                    IsActive = false
                };

                context.MenuItems.AddRange(item1, item2, item3, item4, itemDisabled);
                await context.SaveChangesAsync();
            }

            // 10. Seed Orders
            if (!await context.Orders.AnyAsync())
            {
                var order1 = Guid.Parse("11110000-0000-0000-0000-000000000001");
                var order2 = Guid.Parse("22220000-0000-0000-0000-000000000002");
                var order3 = Guid.Parse("33330000-0000-0000-0000-000000000003");

                context.Orders.AddRange(
                    new Order
                    {
                        Id = order1,
                        UserId = Guid.Parse("22222222-2222-2222-2222-111111111111"), // customer.active@golbox.com
                        CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"), // Şehitkamil Kitap Kafe
                        TotalAmount = 85.00m,
                        PaidWithPoints = false,
                        PointsUsed = 0,
                        Status = "Preparing",
                        CollectionCode = "GB-1042",
                        OrganizationId = orgId,
                        CreatedDate = DateTime.UtcNow.AddMinutes(-15)
                    },
                    new Order
                    {
                        Id = order2,
                        UserId = Guid.Parse("66666666-6666-6666-6666-666666666666"), // customer.loyalty@golbox.com
                        CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                        TotalAmount = 45.00m,
                        PaidWithPoints = false,
                        PointsUsed = 0,
                        Status = "Ready",
                        CollectionCode = "GB-1043",
                        OrganizationId = orgId,
                        CreatedDate = DateTime.UtcNow.AddMinutes(-5)
                    },
                    new Order
                    {
                        Id = order3,
                        UserId = Guid.Parse("66666666-6666-6666-6666-666666666666"), // customer.loyalty@golbox.com
                        CafeId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                        TotalAmount = 40.00m,
                        PaidWithPoints = false,
                        PointsUsed = 0,
                        Status = "Completed",
                        CollectionCode = "GB-1001",
                        OrganizationId = orgId,
                        CreatedDate = DateTime.UtcNow.AddHours(-3)
                    }
                );

                context.OrderItems.AddRange(
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order1,
                        MenuItemId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Türk Kahvesi
                        Quantity = 1,
                        UnitPrice = 40.00m
                    },
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order1,
                        MenuItemId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), // Filtre Kahve
                        Quantity = 1,
                        UnitPrice = 45.00m
                    },
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order2,
                        MenuItemId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), // Filtre Kahve
                        Quantity = 1,
                        UnitPrice = 45.00m
                    },
                    new OrderItem
                    {
                        Id = Guid.NewGuid(),
                        OrderId = order3,
                        MenuItemId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), // Türk Kahvesi
                        Quantity = 1,
                        UnitPrice = 40.00m
                    }
                );
                await context.SaveChangesAsync();
            }

            // 11. Seed Notifications
            if (!await context.UserNotifications.AnyAsync(n => n.OrganizationId == orgId))
            {
                context.UserNotifications.AddRange(
                    new UserNotification
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        UserId = Guid.Parse("22222222-2222-2222-2222-111111111111"), // customer.active@golbox.com
                        Title = "Siparişiniz Hazırlanıyor",
                        Body = "Siparişiniz kafemizde hazırlanmaya başladı.",
                        Type = "Order",
                        IsRead = false,
                        CreatedDate = DateTime.UtcNow.AddMinutes(-10)
                    },
                    new UserNotification
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        UserId = Guid.Parse("66666666-6666-6666-6666-666666666666"), // customer.loyalty@golbox.com
                        Title = "GölPuan Kazanıldı!",
                        Body = "Tamamlanan siparişinizden +10 GP hesabınıza yüklendi.",
                        Type = "Point",
                        IsRead = true,
                        ReadAt = DateTime.UtcNow.AddHours(-2),
                        CreatedDate = DateTime.UtcNow.AddHours(-3)
                    },
                    new UserNotification
                    {
                        Id = Guid.NewGuid(),
                        OrganizationId = orgId,
                        UserId = Guid.Parse("11111111-2222-3333-4444-555555555555"), // customer.event@golbox.com
                        Title = "Yeni Etkinlik Kaydı",
                        Body = "Doğa Yürüyüşü etkinliğine kaydınız başarıyla alındı.",
                        Type = "Activity",
                        IsRead = false,
                        CreatedDate = DateTime.UtcNow.AddHours(-11)
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
