using Microsoft.AspNetCore.Mvc;
using Server.BL;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        [HttpGet("users")]
        public IActionResult GetAllUsers()
        {
            try
            {
                var users = Users.GetAllUsers();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPost("lock/{id}")]
        public IActionResult LockUser(int id)
        {
            try
            {
                bool result = Admin.LockUser(id);
                return result ? Ok("User locked successfully.") : NotFound("User not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPost("unlock/{id}")]
        public IActionResult UnlockUser(int id)
        {
            try
            {
                bool result = Admin.UnlockUser(id);
                return result ? Ok("User unlocked successfully.") : NotFound("User not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteUser(int id)
        {
            try
            {
                int result = Users.DeleteUser(id);
                return result == 1 ? Ok("User deleted successfully.") : NotFound("User not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("stats")]
        public IActionResult GetSystemStats()
        {
            try
            {
                Admin stats = Admin.GetSystemStats();
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }
    }
}
