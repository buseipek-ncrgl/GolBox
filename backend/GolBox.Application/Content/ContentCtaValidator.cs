using GolBox.Application.Common;

namespace GolBox.Application.Content;

public static class ContentCtaValidator
{
    public static Result Validate(string? ctaType, string? ctaTarget)
    {
        var type = ContentCtaTypes.Canonical(ctaType);
        var target = string.IsNullOrWhiteSpace(ctaTarget) ? null : ctaTarget.Trim();

        return type switch
        {
            ContentCtaTypes.None => Result.Ok(),
            ContentCtaTypes.Map => Result.Ok(),
            ContentCtaTypes.Profile => Result.Ok(),
            ContentCtaTypes.RewardCatalog => Result.Ok(),
            ContentCtaTypes.InternalRoute when ContentCtaTypes.IsAllowedInternalRoute(target)
                => Result.Ok(),
            ContentCtaTypes.InternalRoute
                => Result.Fail("CTA hedefi izin verilen iç rotalardan biri olmalıdır."),
            ContentCtaTypes.Activity when Guid.TryParse(target, out _)
                => Result.Ok(),
            ContentCtaTypes.Activity
                => Result.Fail("Etkinlik CTA hedefi geçerli bir kimlik olmalıdır."),
            ContentCtaTypes.Cafe when Guid.TryParse(target, out _)
                => Result.Ok(),
            ContentCtaTypes.Cafe
                => Result.Fail("Kafe CTA hedefi geçerli bir kimlik olmalıdır."),
            ContentCtaTypes.Place when Guid.TryParse(target, out _)
                => Result.Ok(),
            ContentCtaTypes.Place
                => Result.Fail("Tesis CTA hedefi geçerli bir kimlik olmalıdır."),
            ContentCtaTypes.ExternalUrl when TryValidateExternalUrl(target, out _)
                => Result.Ok(),
            ContentCtaTypes.ExternalUrl
                => Result.Fail("Dış bağlantı yalnızca onaylı belediye alan adlarına izin verir."),
            _ => Result.Fail("Bilinmeyen CTA tipi.")
        };
    }

    public static bool TryValidateExternalUrl(string? value, out Uri? uri)
    {
        uri = null;
        if (string.IsNullOrWhiteSpace(value))
            return false;
        if (!Uri.TryCreate(value, UriKind.Absolute, out var parsed))
            return false;
        if (parsed.Scheme != Uri.UriSchemeHttps && parsed.Scheme != Uri.UriSchemeHttp)
            return false;
        if (!string.IsNullOrEmpty(parsed.UserInfo))
            return false;
        var host = parsed.Host.Trim().TrimEnd('.');
        if (ContentCtaTypes.ExternalHosts.Any(h => host.Equals(h, StringComparison.OrdinalIgnoreCase)))
        {
            uri = parsed;
            return true;
        }
        if (host.EndsWith(".sehitkamil.bel.tr", StringComparison.OrdinalIgnoreCase) ||
            host.EndsWith(".gaziantep.bel.tr", StringComparison.OrdinalIgnoreCase))
        {
            uri = parsed;
            return true;
        }
        return false;
    }

    public static string? NormalizeTarget(string ctaType, string? ctaTarget)
    {
        var type = ContentCtaTypes.Canonical(ctaType);
        if (type is ContentCtaTypes.None or ContentCtaTypes.Map or ContentCtaTypes.Profile or ContentCtaTypes.RewardCatalog)
            return null;
        if (string.IsNullOrWhiteSpace(ctaTarget))
            return null;
        var trimmed = ctaTarget.Trim();
        if (type == ContentCtaTypes.InternalRoute)
            return ContentCtaTypes.InternalRoutes.FirstOrDefault(r => r.Equals(trimmed, StringComparison.OrdinalIgnoreCase));
        if (type == ContentCtaTypes.ExternalUrl && TryValidateExternalUrl(trimmed, out var uri) && uri != null)
            return uri.ToString();
        return trimmed;
    }
}
