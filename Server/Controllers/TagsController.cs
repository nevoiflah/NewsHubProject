using Microsoft.AspNetCore.Mvc;
using Server.BL;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TagsController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetAllTags()
        {
            try
            {
                var tags = Tags.GetAllTags();
                return Ok(tags);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("{userId}")]
        public IActionResult GetUserTags(int userId)
        {
            try
            {
                var tags = Tags.GetUserTags(userId);
                return Ok(tags);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPost("save/{userId}")]
        public IActionResult SaveUserTags(int userId, [FromBody] List<int> tagIds)
        {
            try
            {
                bool success = Tags.SaveUserTags(userId, tagIds);
                return Ok(new { success });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
    }
}
