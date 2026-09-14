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
            return Ok(result);
        }

        return BadRequest(result);
    }

    protected ActionResult HandleResult(Result result)
    {
        if (result == null) return NotFound();

        if (result.Success)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }
}
