using Microsoft.EntityFrameworkCore;

namespace GolBox.Application.Common;

public static class DbExceptions
{
    public static bool IsUniqueViolation(DbUpdateException exception)
    {
        for (var inner = exception.InnerException; inner != null; inner = inner.InnerException)
        {
            var message = inner.Message ?? string.Empty;
            if (message.Contains("UNIQUE constraint", StringComparison.OrdinalIgnoreCase)
                || message.Contains("unique index", StringComparison.OrdinalIgnoreCase)
                || message.Contains("duplicate key", StringComparison.OrdinalIgnoreCase)
                || message.Contains("2627")
                || message.Contains("2601"))
                return true;
        }

        return false;
    }
}
