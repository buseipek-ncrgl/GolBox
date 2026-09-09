using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[Authorize]
public class FilesController : BaseApiController
{
    [HttpPost("upload")]
    public async Task<IActionResult> UploadFile(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(Result<object>.Fail("Geçerli bir dosya seçilmedi."));
        }

        // Validate image extension
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (Array.IndexOf(allowedExtensions, ext) < 0)
        {
            return BadRequest(Result<object>.Fail("Yalnızca resim dosyaları (.jpg, .png, .webp, .gif) yüklenebilir."));
        }

        var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = $"{Guid.NewGuid()}{ext}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var fileUrl = $"{Request.Scheme}://{Request.Host}/uploads/{uniqueFileName}";
        return Ok(Result<object>.Ok(new { url = fileUrl, fileName = uniqueFileName }));
    }
}
