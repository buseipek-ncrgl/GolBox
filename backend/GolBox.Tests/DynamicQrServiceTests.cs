using Microsoft.Extensions.Configuration;
using GolBox.Application.Common;
using GolBox.Application.Security;
using GolBox.Infrastructure.Services;
using Xunit;

namespace GolBox.Tests;

public class DynamicQrServiceTests
{
    private static DynamicQrService CreateService(string? key = "unit_test_dynamic_qr_hmac_key_change_me_32")
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Security:DynamicQr:HmacKey"] = key
            })
            .Build();
        return new DynamicQrService(config);
    }

    [Fact]
    public void Generate_And_Validate_Current_Token()
    {
        var service = CreateService();
        var userId = Guid.NewGuid();
        var token = service.GenerateDynamicQrToken(userId);

        Assert.StartsWith("GBQR:", token);
        var result = service.ValidateDynamicQrToken(token);
        Assert.True(result.IsValid);
        Assert.Equal(userId, result.UserId);
    }

    [Fact]
    public void Reject_Malformed_And_Tampered_Tokens()
    {
        var service = CreateService();
        Assert.False(service.ValidateDynamicQrToken("not-a-token").IsValid);
        Assert.False(service.ValidateDynamicQrToken("GBQR:bad").IsValid);

        var userId = Guid.NewGuid();
        var token = service.GenerateDynamicQrToken(userId);
        var tampered = token[..^2] + "xx";
        Assert.False(service.ValidateDynamicQrToken(tampered).IsValid);
    }

    [Fact]
    public void Parser_Prefers_Hmac_And_Allows_Legacy_Guid()
    {
        var service = CreateService();
        var userId = Guid.NewGuid();
        var hmac = service.GenerateDynamicQrToken(userId);
        var parsed = QrTokenParser.Resolve(hmac, service);
        Assert.True(parsed.IsValid);
        Assert.Equal("hmac", parsed.Kind);
        Assert.Equal(userId, parsed.UserId);

        var legacy = QrTokenParser.TryLegacyUserGuid(userId.ToString());
        Assert.True(legacy.IsValid);
        Assert.Equal("legacy-guid", legacy.Kind);

        var jwtLike = QrTokenParser.Resolve("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.aaa.bbb", service);
        Assert.False(jwtLike.IsValid);
    }

    [Fact]
    public void Coupon_Lifecycle_And_Role_Matrix()
    {
        Assert.True(UserRewardStatuses.IsOpenClaim("Claimed"));
        Assert.False(UserRewardStatuses.IsOpenClaim("Expired"));
        Assert.True(RoleMatrix.IsCitizen("User"));
        Assert.True(RoleMatrix.IsStaffOrAdmin("Staff"));
        Assert.False(RoleMatrix.IsAdmin("User"));
    }
}
