using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[AllowAnonymous]
public class SocialController : BaseApiController
{
    private static readonly ConcurrentDictionary<string, SocialPostDto> PostsStore = new();
    private static readonly object SyncLock = new();

    static SocialController()
    {
        SeedDefaultData();
    }

    private static void SeedDefaultData()
    {
        lock (SyncLock)
        {
            if (!PostsStore.IsEmpty) return;

            var defaultPosts = new List<SocialPostDto>
            {
                new SocialPostDto
                {
                    Id = "soc-1",
                    Type = "Reels",
                    Title = "Alleben Göleti Doğa Yürüyüşü",
                    VideoUrl = "https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4",
                    ThumbnailUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80",
                    Caption = "Hafta sonu Alleben Göletinde harika bir sabah yürüyüşü! Siz de katıldınız mı?",
                    AuthorName = "Şehitkamil Belediyesi",
                    LikesCount = 142,
                    ViewsCount = 1850,
                    CommentsCount = 18,
                    Status = "Published",
                    CreatedAt = DateTime.UtcNow.ToString("o")
                },
                new SocialPostDto
                {
                    Id = "soc-2",
                    Type = "Story",
                    Title = "Gençlik Merkezi Kurs Kayıtları",
                    ImageUrl = "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&q=80",
                    Caption = "Gençlik merkezlerimizde yeni dönem kayıtları başladı! Son gün 30 Eylül.",
                    AuthorName = "Şehitkamil Belediyesi",
                    LikesCount = 89,
                    ViewsCount = 940,
                    CommentsCount = 4,
                    Status = "Published",
                    CreatedAt = DateTime.UtcNow.ToString("o")
                }
            };

            foreach (var post in defaultPosts)
            {
                PostsStore.TryAdd(post.Id, post);
            }
        }
    }

    [HttpGet]
    public IActionResult GetPosts([FromQuery] string? status, [FromQuery] string? type, [FromQuery] string? search)
    {
        var query = PostsStore.Values.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(p => p.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(p => p.Type.Equals(type, StringComparison.OrdinalIgnoreCase));
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLowerInvariant();
            query = query.Where(p => (p.Title != null && p.Title.ToLower().Contains(q)) ||
                                     (p.Caption != null && p.Caption.ToLower().Contains(q)));
        }

        var items = query.OrderByDescending(p => p.CreatedAt).ToList();
        return Ok(new { items, totalCount = items.Count });
    }

    [HttpPost]
    public IActionResult CreatePost([FromBody] SocialPostDto dto)
    {
        if (dto == null || (string.IsNullOrWhiteSpace(dto.Title) && string.IsNullOrWhiteSpace(dto.Caption)))
            return BadRequest(Result<object>.Fail("İçerik başlığı veya açıklaması gereklidir."));

        var id = string.IsNullOrWhiteSpace(dto.Id) ? $"soc-{Guid.NewGuid():N}" : dto.Id;
        dto.Id = id;
        dto.CreatedAt = DateTime.UtcNow.ToString("o");
        dto.Status = string.IsNullOrWhiteSpace(dto.Status) ? "Published" : dto.Status;

        PostsStore[id] = dto;
        return Ok(Result<object>.Ok(new { id, success = true }, "İçerik başarıyla oluşturuldu."));
    }

    [HttpPut("{id}")]
    public IActionResult UpdatePost(string id, [FromBody] SocialPostDto dto)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.ContainsKey(id))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        dto.Id = id;
        PostsStore[id] = dto;
        return Ok(Result<object>.Ok(new { id, success = true }, "İçerik güncellendi."));
    }

    [HttpPost("{id}/approve")]
    public IActionResult ApprovePost(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryGetValue(id, out var post))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        post.Status = "Published";
        PostsStore[id] = post;
        return Ok(Result<object>.Ok(new { id, success = true }, "İçerik onaylandı."));
    }

    [HttpPost("{id}/reject")]
    public IActionResult RejectPost(string id, [FromBody] RejectRequest? req)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryGetValue(id, out var post))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        post.Status = "Rejected";
        PostsStore[id] = post;
        return Ok(Result<object>.Ok(new { id, success = true }, "İçerik reddedildi."));
    }

    [HttpPost("{id}/like")]
    public IActionResult LikePost(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryGetValue(id, out var post))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        post.LikesCount++;
        PostsStore[id] = post;
        return Ok(Result<object>.Ok(new { id, likesCount = post.LikesCount, success = true }));
    }

    [HttpPost("{id}/unlike")]
    public IActionResult UnlikePost(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryGetValue(id, out var post))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        if (post.LikesCount > 0) post.LikesCount--;
        PostsStore[id] = post;
        return Ok(Result<object>.Ok(new { id, likesCount = post.LikesCount, success = true }));
    }

    [HttpPost("{id}/view")]
    public IActionResult RecordView(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryGetValue(id, out var post))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        post.ViewsCount++;
        PostsStore[id] = post;
        return Ok(Result<object>.Ok(new { id, viewsCount = post.ViewsCount, success = true }));
    }

    [HttpDelete("{id}")]
    public IActionResult DeletePost(string id)
    {
        if (string.IsNullOrWhiteSpace(id) || !PostsStore.TryRemove(id, out _))
            return NotFound(Result<object>.Fail("İçerik bulunamadı."));

        return Ok(Result<object>.Ok(new { id, success = true }, "İçerik silindi."));
    }
}

public class SocialPostDto
{
    public string Id { get; set; } = string.Empty;
    public string Type { get; set; } = "Reels";
    public string Title { get; set; } = string.Empty;
    public string? VideoUrl { get; set; }
    public string? ThumbnailUrl { get; set; }
    public string? ImageUrl { get; set; }
    public string Caption { get; set; } = string.Empty;
    public string? LocationTag { get; set; }
    public string AuthorName { get; set; } = "Şehitkamil Belediyesi";
    public int LikesCount { get; set; }
    public int ViewsCount { get; set; }
    public int CommentsCount { get; set; }
    public string Status { get; set; } = "Published";
    public string CreatedAt { get; set; } = string.Empty;
}

public class RejectRequest
{
    public string? Reason { get; set; }
}
