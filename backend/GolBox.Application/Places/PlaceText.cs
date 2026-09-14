using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using GolBox.Application.Common;
using GolBox.Domain.Entities;

namespace GolBox.Application.Places;

public static class PlaceText
{
    private static readonly Regex HyphenRuns = new("-{2,}", RegexOptions.Compiled);
    private static readonly Regex NonSlug = new("[^a-z0-9-]+", RegexOptions.Compiled);

    public static string Fold(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return string.Empty;

        var trimmed = value.Trim();
        var builder = new StringBuilder(trimmed.Length);
        foreach (var ch in trimmed.Normalize(NormalizationForm.FormD))
        {
            var mapped = ch switch
            {
                'ı' or 'I' or 'İ' or 'i' => 'i',
                'ş' or 'Ş' => 's',
                'ğ' or 'Ğ' => 'g',
                'ü' or 'Ü' => 'u',
                'ö' or 'Ö' => 'o',
                'ç' or 'Ç' => 'c',
                _ => ch
            };
            var category = CharUnicodeInfo.GetUnicodeCategory(mapped);
            if (category is UnicodeCategory.NonSpacingMark)
                continue;
            builder.Append(char.ToLowerInvariant(mapped));
        }

        return builder.ToString().Normalize(NormalizationForm.FormC);
    }

    public static string Slugify(string? name, Guid id)
    {
        var folded = Fold(name).Replace(' ', '-');
        folded = NonSlug.Replace(folded, "-");
        folded = HyphenRuns.Replace(folded, "-").Trim('-');
        if (string.IsNullOrWhiteSpace(folded))
            folded = "tesis";
        if (folded.Length > 72)
            folded = folded[..72].Trim('-');
        return $"{folded}-{id.ToString("N")[..8]}";
    }

    public static string CafeSlug(Guid cafeId) => $"cafe-{cafeId:N}";

    public static string BuildSearchNormalized(Place place)
    {
        var parts = new[]
        {
            place.Name,
            place.District,
            place.Neighborhood,
            place.Address,
            place.Category,
            PlaceCategories.SearchKeywords(place.Category)
        };
        return Fold(string.Join(' ', parts.Where(p => !string.IsNullOrWhiteSpace(p))));
    }

    public static string AddressSummary(Place place)
    {
        if (!string.IsNullOrWhiteSpace(place.Neighborhood) && !string.IsNullOrWhiteSpace(place.District))
            return $"{place.Neighborhood} · {place.District}";
        if (!string.IsNullOrWhiteSpace(place.District))
            return place.District!;
        if (!string.IsNullOrWhiteSpace(place.Neighborhood))
            return place.Neighborhood!;
        if (!string.IsNullOrWhiteSpace(place.Address))
        {
            var first = place.Address!.Split(',', 2, StringSplitOptions.TrimEntries)[0];
            return first.Length > 48 ? first[..48] : first;
        }
        return string.Empty;
    }
}
