using Microsoft.Extensions.Caching.Memory;
using GolBox.Application.Interfaces;

namespace GolBox.Api.Services;

public sealed class CityContentCache : ICityContentCache
{
    private readonly IMemoryCache _cache;
    private string _version = "v0";
    private readonly object _gate = new();

    public CityContentCache(IMemoryCache cache)
    {
        _cache = cache;
    }

    public string Version
    {
        get
        {
            lock (_gate) return _version;
        }
    }

    public bool TryGet<T>(string key, out T? value)
    {
        if (_cache.TryGetValue(key, out var boxed) && boxed is T typed)
        {
            value = typed;
            return true;
        }

        value = default;
        return false;
    }

    public void Set<T>(string key, T value, TimeSpan ttl) =>
        _cache.Set(key, value, ttl);

    public void InvalidatePublicContent()
    {
        lock (_gate)
            _version = Guid.NewGuid().ToString("N");
    }
}
