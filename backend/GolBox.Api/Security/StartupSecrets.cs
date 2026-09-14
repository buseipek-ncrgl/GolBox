using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace GolBox.Api.Security;

public static class StartupSecrets
{
    private static readonly string[] ForbiddenJwtKeys =
    {
        "default_very_long_security_key_for_testing_purposes_only",
        "golbox_secret_jwt_sign_key_for_development_and_testing_needs_to_be_at_least_256_bits_long",
        "golbox_dev_only_jwt_sign_key_change_me_at_least_256_bits_long"
    };

    private static readonly string[] ForbiddenHmacKeys =
    {
        "GolBox_SuperSecret_DynamicQR_HMACKey_2026",
        "golbox_dev_only_dynamic_qr_hmac_key_change_me_2026"
    };

    public static void Validate(IConfiguration configuration, IHostEnvironment environment)
    {
        var jwtKey = configuration["Jwt:Key"];
        RequireSecret(jwtKey, "Jwt:Key", 32);

        var hmacKey = configuration["Security:DynamicQr:HmacKey"];
        RequireSecret(hmacKey, "Security:DynamicQr:HmacKey", 32);

        if (!environment.IsProduction())
            return;

        RejectKnownPlaceholder(jwtKey!, "Jwt:Key", ForbiddenJwtKeys);
        RejectKnownPlaceholder(hmacKey!, "Security:DynamicQr:HmacKey", ForbiddenHmacKeys);

        var origins = configuration.GetSection("Security:Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
        if (origins.Length == 0)
        {
            throw new InvalidOperationException(
                "Production requires Security:Cors:AllowedOrigins with explicit frontend/admin domains.");
        }

        if (origins.Any(o => o == "*" || string.Equals(o, "null", StringComparison.OrdinalIgnoreCase)))
        {
            throw new InvalidOperationException("Production CORS cannot use wildcard origins.");
        }

        var connection = DatabaseProvider.ResolveConnectionString(configuration, optional: true);
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException(
                "Production requires ConnectionStrings:Default (or DefaultConnection) pointing at SQL Server.");
        }

        if (DatabaseProvider.IsSqlite(connection))
        {
            throw new InvalidOperationException(
                "Production cannot use SQLite. Set ConnectionStrings:Default to SQL Server.");
        }
    }

    private static void RequireSecret(string? value, string key, int minLength)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length < minLength)
        {
            throw new InvalidOperationException($"{key} is not configured or is shorter than {minLength} characters.");
        }
    }

    private static void RejectKnownPlaceholder(string value, string key, IEnumerable<string> forbidden)
    {
        if (forbidden.Any(f => string.Equals(f, value, StringComparison.Ordinal)))
        {
            throw new InvalidOperationException(
                $"{key} is a development placeholder and cannot be used in production.");
        }
    }
}

public static class DatabaseProvider
{
    public static string? ResolveConnectionString(IConfiguration configuration, bool optional = false)
    {
        var value = configuration.GetConnectionString("Default")
                    ?? configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(value))
            return value;
        return optional ? null : "Data Source=golbox.db";
    }

    public static bool IsSqlite(string connectionString)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return true;

        if (connectionString.Contains("golbox.db", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("Mode=Memory", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("Filename=", StringComparison.OrdinalIgnoreCase))
            return true;

        var looksLikeSqlServer =
            connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase)
            || connectionString.Contains("Initial Catalog=", StringComparison.OrdinalIgnoreCase)
            || (connectionString.Contains("Database=", StringComparison.OrdinalIgnoreCase)
                && !connectionString.Contains(".db", StringComparison.OrdinalIgnoreCase));

        if (looksLikeSqlServer)
            return false;

        return connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);
    }
}
