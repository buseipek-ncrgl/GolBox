using System.Net.Mail;
using System.Text.RegularExpressions;
using GolBox.Application.Common;
using GolBox.Application.Content;

namespace GolBox.Application.Places;

public static class PlaceRules
{
    public const int MaxGalleryImages = 10;
    public const int MaxPageSize = 50;
    public const int DefaultPageSize = 20;
    public const int PublicCacheSeconds = 20;

    private static readonly Regex PhonePattern = new(@"^\+?[0-9\s().-]{7,24}$", RegexOptions.Compiled);

    public static Result ValidateWrite(
        string? name,
        string? category,
        decimal? latitude,
        decimal? longitude,
        string? phone,
        string? email,
        string? websiteUrl,
        string? coverImageUrl,
        IEnumerable<string>? amenities)
    {
        if (string.IsNullOrWhiteSpace(name))
            return Result.Fail("Tesis adı zorunludur.");
        if (name.Trim().Length > 256)
            return Result.Fail("Tesis adı 256 karakteri aşamaz.");
        if (!string.IsNullOrWhiteSpace(category) && !PlaceCategories.IsKnown(category))
            return Result.Fail("Geçersiz tesis kategorisi.");
        if (latitude.HasValue && !PlaceGeo.IsValidLatitude(latitude))
            return Result.Fail("Enlem -90 ile 90 arasında olmalıdır.");
        if (longitude.HasValue && !PlaceGeo.IsValidLongitude(longitude))
            return Result.Fail("Boylam -180 ile 180 arasında olmalıdır.");
        if ((latitude.HasValue && !longitude.HasValue) || (!latitude.HasValue && longitude.HasValue))
            return Result.Fail("Enlem ve boylam birlikte gönderilmelidir.");
        if (!string.IsNullOrWhiteSpace(phone) && !PhonePattern.IsMatch(phone.Trim()))
            return Result.Fail("Telefon biçimi geçersiz.");
        if (!string.IsNullOrWhiteSpace(email) && !IsEmail(email))
            return Result.Fail("E-posta biçimi geçersiz.");
        if (!string.IsNullOrWhiteSpace(websiteUrl) && !IsHttpUrl(websiteUrl))
            return Result.Fail("Web adresi http veya https olmalıdır.");
        if (!string.IsNullOrWhiteSpace(coverImageUrl) && MediaUrlNormalizer.Normalize(coverImageUrl) == null)
            return Result.Fail("Görsel adresi geçersiz.");
        if (amenities != null && amenities.Any(a => !PlaceAmenities.IsKnown(a)))
            return Result.Fail("Geçersiz olanak kodu.");
        return Result.Ok();
    }

    public static bool IsEmail(string value)
    {
        try
        {
            _ = new MailAddress(value.Trim());
            return value.Contains('@', StringComparison.Ordinal);
        }
        catch
        {
            return false;
        }
    }

    public static bool IsHttpUrl(string value) =>
        Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri) &&
        (uri.Scheme == Uri.UriSchemeHttps || uri.Scheme == Uri.UriSchemeHttp) &&
        string.IsNullOrEmpty(uri.UserInfo);
}
