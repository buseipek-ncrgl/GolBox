using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
public class ApplicationsController : BaseApiController
{
    private static readonly ConcurrentDictionary<string, ApplicationProgramDto> ProgramsStore = new();
    private static readonly ConcurrentDictionary<string, CitizenApplicationDto> SubmissionsStore = new();
    private static readonly object SyncLock = new();

    static ApplicationsController()
    {
        SeedDefaultData();
    }

    private static void SeedDefaultData()
    {
        lock (SyncLock)
        {
            if (!ProgramsStore.IsEmpty) return;

            var defaultProgs = new List<ApplicationProgramDto>
            {
                new ApplicationProgramDto
                {
                    Id = "prog-1",
                    Title = "Üniversite ve Lise Öğrenci Kırtasiye Desteği",
                    Category = "Eğitim Desteği",
                    Description = "Şehitkamil ilçe sınırlarında ikamet eden öğrencilere tek seferlik eğitim ve kırtasiye desteği.",
                    StartDate = "2026-09-01",
                    EndDate = "2026-12-31",
                    IsActive = true,
                    RequiredDocuments = new List<string>
                    {
                        "T.C. Kimlik Fotokopisi / Beyanı",
                        "İkametgah Belgesi (e-Devlet Barkodlu)",
                        "Öğrenci Belgesi (e-Devlet / Transkript)"
                    }
                },
                new ApplicationProgramDto
                {
                    Id = "prog-2",
                    Title = "Sosyal ve Erzak Yardım Başvurusu",
                    Category = "Sosyal Yardım",
                    Description = "İhtiyaç sahibi aileler için erzak paketi ve sosyal destek programı.",
                    StartDate = "2026-01-01",
                    EndDate = "2026-12-31",
                    IsActive = true,
                    RequiredDocuments = new List<string>
                    {
                        "T.C. Kimlik Fotokopisi / Beyanı",
                        "Gelir Belgesi / Maaş Bordrosu",
                        "Aile Nüfus Kayıt Örneği"
                    }
                },
                new ApplicationProgramDto
                {
                    Id = "prog-3",
                    Title = "Evde Yaşlı Bakımı ve Destek Hizmeti",
                    Category = "Sağlık ve Bakım",
                    Description = "65 yaş üstü yalnız yaşayan vatandaşlarımıza evde sağlık ve bakım desteği.",
                    StartDate = "2026-01-01",
                    EndDate = "2026-12-31",
                    IsActive = true,
                    RequiredDocuments = new List<string>
                    {
                        "Sağlık Kurulu / Engelli Raporu",
                        "T.C. Kimlik Fotokopisi / Beyanı"
                    }
                }
            };

            foreach (var prog in defaultProgs)
            {
                ProgramsStore.TryAdd(prog.Id, prog);
            }

            var defaultSubmissions = new List<CitizenApplicationDto>
            {
                new CitizenApplicationDto
                {
                    Id = "app-1",
                    ProgramId = "prog-1",
                    ProgramTitle = "Üniversite ve Lise Öğrenci Kırtasiye Desteği",
                    CitizenName = "Ahmet Yılmaz",
                    TcNo = "12345678901",
                    Phone = "0555 123 4567",
                    Status = "UnderReview",
                    AppliedAt = DateTime.UtcNow.ToString("o"),
                    Documents = new List<ApplicationDocumentDto>
                    {
                        new ApplicationDocumentDto { Name = "Ogrenci_Belgesi.pdf", Url = "/uploads/dummy.pdf" },
                        new ApplicationDocumentDto { Name = "Ikametgah.pdf", Url = "/uploads/dummy.pdf" }
                    },
                    Note = "Ön incelemeden geçti. Gelir kontrolü yapılıyor."
                }
            };

            foreach (var sub in defaultSubmissions)
            {
                SubmissionsStore.TryAdd(sub.Id, sub);
            }
        }
    }

    [HttpGet("programs/admin")]
    public IActionResult GetAdminPrograms()
    {
        var list = ProgramsStore.Values
            .OrderByDescending(p => p.Id)
            .ToList();
        return Ok(list);
    }

    [HttpGet("programs")]
    public IActionResult GetActivePrograms()
    {
        var today = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var list = ProgramsStore.Values
            .Where(p => p.IsActive && (string.IsNullOrEmpty(p.EndDate) || p.EndDate.CompareTo(today) >= 0))
            .OrderByDescending(p => p.Id)
            .ToList();
        return Ok(list);
    }

    [HttpPost("programs")]
    public IActionResult CreateProgram([FromBody] ApplicationProgramDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(Result<object>.Fail("Program başlığı zorunludur."));

        var id = string.IsNullOrWhiteSpace(dto.Id) ? $"prog-{Guid.NewGuid():N}" : dto.Id;
        dto.Id = id;
        dto.RequiredDocuments ??= new List<string>();

        ProgramsStore[id] = dto;
        return Ok(Result<object>.Ok(new { id, success = true }, "Program başarıyla oluşturuldu."));
    }

    [HttpPut("programs/{id}")]
    public IActionResult UpdateProgram(string id, [FromBody] ApplicationProgramDto dto)
    {
        if (string.IsNullOrWhiteSpace(id) || !ProgramsStore.ContainsKey(id))
            return NotFound(Result<object>.Fail("Program bulunamadı."));

        dto.Id = id;
        dto.RequiredDocuments ??= new List<string>();
        ProgramsStore[id] = dto;

        return Ok(Result<object>.Ok(new { id, success = true }, "Program başarıyla güncellendi."));
    }

    [HttpPut("programs/{id}/toggle")]
    public IActionResult ToggleProgramStatus(string id, [FromBody] ToggleStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(id) || !ProgramsStore.TryGetValue(id, out var existing))
            return NotFound(Result<object>.Fail("Program bulunamadı."));

        existing.IsActive = req?.IsActive ?? !existing.IsActive;
        ProgramsStore[id] = existing;

        return Ok(Result<object>.Ok(new { id, isActive = existing.IsActive }, "Durum güncellendi."));
    }

    [HttpDelete("programs/{id}")]
    public IActionResult DeleteProgram(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !ProgramsStore.TryRemove(id, out _))
            return NotFound(Result<object>.Fail("Program bulunamadı."));

        return Ok(Result<object>.Ok(new { id, success = true }, "Program silindi."));
    }

    [HttpGet("admin")]
    public IActionResult GetAdminApplications([FromQuery] string? status, [FromQuery] string? search)
    {
        var query = SubmissionsStore.Values.AsQueryable();
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(a => a.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            query = query.Where(a => (a.CitizenName != null && a.CitizenName.ToLower().Contains(q)) ||
                                     (a.ProgramTitle != null && a.ProgramTitle.ToLower().Contains(q)));
        }

        var items = query.OrderByDescending(a => a.AppliedAt).ToList();
        return Ok(new { items, totalCount = items.Count });
    }

    [HttpPost]
    public IActionResult SubmitApplication([FromBody] CitizenApplicationDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ProgramTitle))
            return BadRequest(Result<object>.Fail("Geçersiz başvuru verisi."));

        var id = string.IsNullOrWhiteSpace(dto.Id) ? $"app-{Guid.NewGuid():N}" : dto.Id;
        dto.Id = id;
        dto.AppliedAt = DateTime.UtcNow.ToString("o");
        dto.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Submitted" : dto.Status;
        dto.Documents ??= new List<ApplicationDocumentDto>();

        SubmissionsStore[id] = dto;
        return Ok(Result<object>.Ok(new { id, success = true }, "Başvuru başarıyla alındı."));
    }

    [HttpPut("{id}/status")]
    public IActionResult UpdateStatus(string id, [FromBody] UpdateStatusRequest req)
    {
        if (string.IsNullOrWhiteSpace(id) || !SubmissionsStore.TryGetValue(id, out var existing))
            return NotFound(Result<object>.Fail("Başvuru bulunamadı."));

        if (!string.IsNullOrWhiteSpace(req?.Status))
        {
            existing.Status = req.Status;
        }
        if (req?.Note != null)
        {
            existing.Note = req.Note;
        }

        SubmissionsStore[id] = existing;
        return Ok(Result<object>.Ok(new { id, success = true }, "Başvuru durumu güncellendi."));
    }
}

public class ApplicationProgramDto
{
    public string Id { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string StartDate { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public List<string> RequiredDocuments { get; set; } = new();
}

public class CitizenApplicationDto
{
    public string Id { get; set; } = string.Empty;
    public string ProgramId { get; set; } = string.Empty;
    public string ProgramTitle { get; set; } = string.Empty;
    public string CitizenName { get; set; } = string.Empty;
    public string TcNo { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Status { get; set; } = "Submitted";
    public string AppliedAt { get; set; } = string.Empty;
    public List<ApplicationDocumentDto> Documents { get; set; } = new();
    public string? Note { get; set; }
}

public class ApplicationDocumentDto
{
    public string Name { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
}

public class ToggleStatusRequest
{
    public bool IsActive { get; set; }
}

public class UpdateStatusRequest
{
    public string? Status { get; set; }
    public string? Note { get; set; }
}
