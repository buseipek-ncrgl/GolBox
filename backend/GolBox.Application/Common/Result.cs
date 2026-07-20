using System.Collections.Generic;

namespace GolBox.Application.Common;

public class Result<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static Result<T> Ok(T data, string message = "İşlem başarılı.") =>
        new() { Success = true, Message = message, Data = data };

    public static Result<T> Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? new List<string> { message } };
}

public class Result
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }

    public static Result Ok(string message = "İşlem başarılı.") =>
        new() { Success = true, Message = message };

    public static Result Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors ?? new List<string> { message } };
}
