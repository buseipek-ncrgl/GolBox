using System;
using System.Collections.Generic;
using GolBox.Domain.Common;

namespace GolBox.Domain.Entities;

public class Organization : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string ThemeColor { get; set; } = "#FF6600";
    public string? LogoUrl { get; set; }
    public string TimeZone { get; set; } = "Europe/Istanbul";

    public virtual ICollection<User> Users { get; set; } = new List<User>();
    public virtual ICollection<Setting> Settings { get; set; } = new List<Setting>();
    public virtual ICollection<Cafe> Cafes { get; set; } = new List<Cafe>();
    public virtual ICollection<Place> Places { get; set; } = new List<Place>();
}
