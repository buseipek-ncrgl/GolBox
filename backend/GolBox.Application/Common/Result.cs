using System.Collections.Generic;

namespace GolBox.Application.Common;

public class Result<T>
{
    public bool Success { get; set; }
    public bool IsConflict { get; set; }
    public bool IsForbidden { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static Result<T> Ok(T data, string message = "İşlem başarılı.") =>
        new() { Success = true, Message = message, Data = data };

    public static Result<T> Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? new List<string> { message } };

    public static Result<T> FailConflict(string message) =>
        new() { Success = false, IsConflict = true, Message = message, Errors = new List<string> { message } };

    public static Result<T> FailForbidden(string message) =>
        new() { Success = false, IsForbidden = true, Message = message, Errors = new List<string> { message } };
}

public class Result
{
    public bool Success { get; set; }
    public bool IsConflict { get; set; }
    public bool IsForbidden { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }

    public static Result Ok(string message = "İşlem başarılı.") =>
        new() { Success = true, Message = message };

    public static Result Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? new List<string> { message } };

    public static Result FailConflict(string message) =>
        new() { Success = false, IsConflict = true, Message = message, Errors = new List<string> { message } };

    public static Result FailForbidden(string message) =>
        new() { Success = false, IsForbidden = true, Message = message, Errors = new List<string> { message } };
}
