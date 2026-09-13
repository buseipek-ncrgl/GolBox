namespace GolBox.Application.Content;

public static class MediaUrlNormalizer
{
    public static string? Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var trimmed = value.Trim();
        var uploads = trimmed.IndexOf("/uploads/", StringComparison.OrdinalIgnoreCase);
        if (uploads >= 0)
        {
            var relative = trimmed[uploads..];
            var query = relative.IndexOfAny(['?', '#']);
            return query >= 0 ? relative[..query] : relative;
        }

        if (trimmed.StartsWith("/city/", StringComparison.OrdinalIgnoreCase) ||
            trimmed.StartsWith("/models/", StringComparison.OrdinalIgnoreCase))
            return trimmed;

        if (ContentCtaValidator.TryValidateExternalUrl(trimmed, out var uri) && uri != null)
            return uri.ToString();

        if (trimmed.StartsWith('/') && !trimmed.StartsWith("//", StringComparison.Ordinal))
            return trimmed;

        return null;
    }
}
