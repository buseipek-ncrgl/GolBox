using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[Authorize]
public class FilesController : BaseApiController
{
    private const long MaxBytes = 5 * 1024 * 1024;
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
    private static readonly string[] BlockedExtensions =
        [".exe", ".dll", ".bat", ".cmd", ".com", ".js", ".mjs", ".html", ".htm", ".svg", ".xml", ".php", ".sh", ".ps1"];

    [HttpPost("upload")]
    [RequestSizeLimit(MaxBytes + 512_000)]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(Result<object>.Fail("Geçerli bir dosya seçilmedi."));

        if (file.Length > MaxBytes)
            return BadRequest(Result<object>.Fail("Dosya boyutu 5 MB sınırını aşıyor."));

        var originalName = Path.GetFileName(file.FileName ?? string.Empty);
        if (string.IsNullOrWhiteSpace(originalName) || originalName.Contains("..") || originalName.IndexOfAny(Path.GetInvalidFileNameChars()) >= 0)
            return BadRequest(Result<object>.Fail("Geçersiz dosya adı."));

        var ext = Path.GetExtension(originalName).ToLowerInvariant();
        if (BlockedExtensions.Contains(ext) || Array.IndexOf(AllowedExtensions, ext) < 0)
            return BadRequest(Result<object>.Fail("Yalnızca resim dosyaları (.jpg, .png, .webp, .gif) yüklenebilir."));

        await using var buffer = new MemoryStream();
        await file.CopyToAsync(buffer);
        var bytes = buffer.ToArray();
        if (!IsAllowedImage(bytes, ext, file.ContentType))
            return BadRequest(Result<object>.Fail("Dosya içeriği izin verilen resim türleriyle eşleşmiyor."));

        var uploadsFolder = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads"));
        Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid():N}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);
        if (!Path.GetFullPath(filePath).StartsWith(uploadsFolder, StringComparison.OrdinalIgnoreCase))
            return BadRequest(Result<object>.Fail("Geçersiz yükleme yolu."));

        await System.IO.File.WriteAllBytesAsync(filePath, bytes);

        var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
        return Ok(Result<object>.Ok(new
        {
            url = fileUrl,
            fileName = uniqueFileName,
            originalFileName = originalName
        }));
    }

    private static bool IsAllowedImage(byte[] bytes, string ext, string? contentType)
    {
        if (bytes.Length < 12)
            return false;

        var mime = (contentType ?? string.Empty).Split(';')[0].Trim().ToLowerInvariant();
        var jpeg = bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF;
        var png = bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47;
        var gif = bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46;
        var webp = bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46
                   && bytes[8] == 0x57 && bytes[9] == 0x45 && bytes[10] == 0x42 && bytes[11] == 0x50;

        return ext switch
        {
            ".jpg" or ".jpeg" => jpeg && (string.IsNullOrEmpty(mime) || mime == "image/jpeg"),
            ".png" => png && (string.IsNullOrEmpty(mime) || mime == "image/png"),
            ".gif" => gif && (string.IsNullOrEmpty(mime) || mime == "image/gif"),
            ".webp" => webp && (string.IsNullOrEmpty(mime) || mime == "image/webp"),
            _ => false
        };
    }
}
