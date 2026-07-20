using System;

namespace GolBox.Application.Interfaces;

public interface ITokenDecoder
{
    Guid? GetUserIdFromToken(string token);
}
