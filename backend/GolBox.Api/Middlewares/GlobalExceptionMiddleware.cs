using System;
using System.Collections.Generic;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using GolBox.Application.Common;

namespace GolBox.Api.Middlewares;

public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Beklenmeyen bir hata oluştu: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";

        if (exception is DbUpdateConcurrencyException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Conflict;
            var conflict = Result.Fail("Kayıt başka bir işlem tarafından güncellendi. Lütfen tekrar deneyin.");
            var conflictJson = JsonSerializer.Serialize(conflict, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            await context.Response.WriteAsync(conflictJson);
            return;
        }

        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var message = "Sunucu tarafında beklenmeyen bir hata oluştu.";
        var errors = new List<string> { message };

        if (_env.IsDevelopment())
        {
            errors = new List<string> { exception.Message, exception.StackTrace ?? string.Empty };
        }

        var response = Result.Fail(message, errors);
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        var json = JsonSerializer.Serialize(response, options);

        await context.Response.WriteAsync(json);
    }
}
