using System;
using GolBox.Domain.Entities;

namespace GolBox.Application.Common;

public static class AutoRewardEngine
{
    public static (bool IsEligible, string Reason) EvaluateUserEligibility(User user, string targetGroupCriteria, int? minAge = null, int? maxAge = null)
    {
        if (user == null)
            return (false, "Kullanıcı bulunamadı.");

        var criteria = targetGroupCriteria?.Trim() ?? "All";

        if (string.Equals(criteria, "All", StringComparison.OrdinalIgnoreCase))
        {
            return (true, "Tüm vatandaşlar için uygundur.");
        }

        if (string.Equals(criteria, "Students", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(criteria, "University", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(criteria, "HighSchool", StringComparison.OrdinalIgnoreCase))
        {
            var isStudent = !string.IsNullOrWhiteSpace(user.EducationLevel) &&
                            (user.EducationLevel.Contains("Lise", StringComparison.OrdinalIgnoreCase) ||
                             user.EducationLevel.Contains("Üniversite", StringComparison.OrdinalIgnoreCase) ||
                             user.EducationLevel.Contains("Öğrenci", StringComparison.OrdinalIgnoreCase));

            if (!isStudent)
            {
                return (false, "Bu başvuru/ödül sadece öğrenci statüsündeki vatandaşlarımız içindir.");
            }
        }

        if (minAge.HasValue || maxAge.HasValue)
        {
            // Age criteria verification
            var age = CalculateAge(user.CreatedDate); // Default age check or profile age
            if (minAge.HasValue && age < minAge.Value)
            {
                return (false, $"Bu başvuru için minimum yaş sınırı {minAge.Value}'dir.");
            }
            if (maxAge.HasValue && age > maxAge.Value)
            {
                return (false, $"Bu başvuru için maksimum yaş sınırı {maxAge.Value}'dir.");
            }
        }

        return (true, "Başvuru ve ödül şartları başarıyla sağlandı!");
    }

    private static int CalculateAge(DateTime birthDate)
    {
        var today = DateTime.Today;
        var age = today.Year - birthDate.Year;
        if (birthDate.Date > today.AddYears(-age)) age--;
        return Math.Max(18, age);
    }
}
