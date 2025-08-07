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

        [HttpGet("analytics/logins")]
        public IActionResult GetLoginAnalytics()
        {
            // Example: logins per day for the last 7 days
            var labels = new List<string>();
            var values = new List<int>();
            for (int i = 6; i >= 0; i--)
            {
                var day = DateTime.Now.AddDays(-i);
                labels.Add(day.ToString("ddd"));
                // TODO: Replace with real data from DB
                values.Add(new Random().Next(5, 25));
            }
            return Ok(new { labels, values });
        }

        [HttpGet("analytics/activity")]
        public IActionResult GetUserActivityAnalytics()
        {
            // Example: user activity distribution
            // TODO: Replace with real data from DB
            var labels = new List<string> { "Active Users", "Locked Users", "New Users" };
            var values = new List<int> { 65, 10, 25 };
            return Ok(new { labels, values });
        }
    }
}
