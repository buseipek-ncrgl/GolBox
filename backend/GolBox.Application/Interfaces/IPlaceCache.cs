namespace GolBox.Application.Interfaces;

public interface IPlaceCache
{
    string Version { get; }
    bool TryGet<T>(string key, out T? value);
    void Set<T>(string key, T value, TimeSpan ttl);
    void Invalidate();
}
