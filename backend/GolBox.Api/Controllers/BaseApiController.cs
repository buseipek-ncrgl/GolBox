using Microsoft.AspNetCore.Mvc;
using GolBox.Application.Common;

namespace GolBox.Api.Controllers;

[ApiController]
[Route("api/v1/[controller]")]
public abstract class BaseApiController : ControllerBase
{
    protected ActionResult HandleResult<T>(Result<T> result)
    {
        if (result == null) return NotFound();

        if (result.Success)
        {
            if (result.Data == null)
                return NoContent();

            return Ok(result);
        }

        // Standard validation or rule violations: HTTP 422
        return UnprocessableEntity(result);
    }

    protected ActionResult HandleResult(Result result)
    {
        if (result == null) return NotFound();

        if (result.Success)
        {
            return Ok(result);
        }

        // Standard validation or rule violations: HTTP 422
        return UnprocessableEntity(result);
    }
}
