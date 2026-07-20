using System;

namespace GolBox.Application.Interfaces;

public interface ICurrentUserService
{
    Guid? UserId { get; }
}
