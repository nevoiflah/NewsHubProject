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
                // Try to get real stats, but if it fails, return default values
                try
                {
                    Admin stats = Admin.GetSystemStats();
                    return Ok(stats);
                }
                catch (Exception dbEx)
                {
                    // Console.WriteLine($"⚠️ Could not get system stats from DB: {dbEx.Message}");
                    // Return default stats if DB call fails
                    var defaultStats = new Admin(0, 0, 0, 0);
                    return Ok(defaultStats);
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"❌ Error in GetSystemStats: {ex.Message}");
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("analytics/logins")]
        public IActionResult GetLoginAnalytics([FromQuery] int days = 7)
        {
            try
            {
                var loginStats = Admin.GetDailyLoginStats(days);
                
                // Create date range for last 'days' days to ensure we have all dates
                var labels = new List<string>();
                var values = new List<int>();
                
                for (int i = days - 1; i >= 0; i--)
                {
                    var date = DateTime.Now.AddDays(-i).ToString("yyyy-MM-dd");
                    var dayName = DateTime.Now.AddDays(-i).ToString("ddd");
                    
                    labels.Add(dayName);
                    
                    // Find matching login count for this date
                    var stat = loginStats.FirstOrDefault(s => s.Date == date);
                    values.Add(stat.Count);
                }
                
                return Ok(new { 
                    labels, 
                    values,
                    title = $"Daily Logins (Last {days} days)"
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"❌ Error in GetLoginAnalytics: {ex.Message}");
                // Return default data on error
                var labels = new List<string>();
                var values = new List<int>();
                for (int i = 6; i >= 0; i--)
                {
                    labels.Add(DateTime.Now.AddDays(-i).ToString("ddd"));
                    values.Add(0);
                }
                return Ok(new { labels, values, title = "Daily Logins (No Data)" });
            }
        }

        [HttpGet("analytics/activity")]
        public IActionResult GetUserActivityAnalytics()
        {
            try
            {
                var (totalUsers, activeUsers, lockedUsers, newUsersThisWeek, adminUsers) = Admin.GetUserActivityStats();
                
                var labels = new List<string> { "Active Users", "Locked Users", "New Users (This Week)", "Admin Users" };
                var values = new List<int> { activeUsers, lockedUsers, newUsersThisWeek, adminUsers };
                
                return Ok(new { 
                    labels, 
                    values,
                    totalUsers,
                    title = "User Activity Distribution"
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"❌ Error in GetUserActivityAnalytics: {ex.Message}");
                // Return default data on error
                var labels = new List<string> { "Active Users", "Locked Users", "New Users" };
                var values = new List<int> { 0, 0, 0 };
                return Ok(new { labels, values, totalUsers = 0, title = "User Activity (No Data)" });
            }
        }

        [HttpGet("analytics/registrations")]
        public IActionResult GetRegistrationAnalytics([FromQuery] int days = 30)
        {
            try
            {
                var regStats = Admin.GetDailyRegistrationStats(days);
                
                // Create date range for last 'days' days
                var labels = new List<string>();
                var values = new List<int>();
                
                for (int i = days - 1; i >= 0; i--)
                {
                    var date = DateTime.Now.AddDays(-i).ToString("yyyy-MM-dd");
                    var dayLabel = DateTime.Now.AddDays(-i).ToString("MM/dd");
                    
                    labels.Add(dayLabel);
                    
                    // Find matching registration count for this date
                    var stat = regStats.FirstOrDefault(s => s.Date == date);
                    values.Add(stat.Count);
                }
                
                return Ok(new { 
                    labels, 
                    values,
                    title = $"Daily Registrations (Last {days} days)"
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"❌ Error in GetRegistrationAnalytics: {ex.Message}");
                return Ok(new { 
                    labels = new List<string>(), 
                    values = new List<int>(),
                    title = "Daily Registrations (No Data)"
                });
            }
        }

        [HttpGet("analytics/content")]
        public IActionResult GetContentAnalytics([FromQuery] int days = 7)
        {
            try
            {
                var contentStats = Admin.GetDailyContentStats(days);
                var overallStats = Admin.GetContentStats();
                
                var labels = new List<string>();
                var sharedArticlesData = new List<int>();
                var reportsData = new List<int>();
                
                for (int i = days - 1; i >= 0; i--)
                {
                    var date = DateTime.Now.AddDays(-i).ToString("yyyy-MM-dd");
                    var dayLabel = DateTime.Now.AddDays(-i).ToString("MM/dd");
                    
                    labels.Add(dayLabel);
                    
                    var stat = contentStats.FirstOrDefault(s => s.Date == date);
                    sharedArticlesData.Add(stat.SharedArticles);
                    reportsData.Add(stat.Reports);
                }
                
                return Ok(new { 
                    labels,
                    datasets = new[] {
                        new { 
                            label = "Shared Articles",
                            data = sharedArticlesData,
                            borderColor = "rgb(75, 192, 192)",
                            backgroundColor = "rgba(75, 192, 192, 0.2)"
                        },
                        new { 
                            label = "Reports",
                            data = reportsData,
                            borderColor = "rgb(255, 99, 132)",
                            backgroundColor = "rgba(255, 99, 132, 0.2)"
                        }
                    },
                    overallStats = new {
                        totalSharedArticles = overallStats.TotalSharedArticles,
                        totalReports = overallStats.TotalReports,
                        pendingReports = overallStats.PendingReports,
                        sharedArticlesToday = overallStats.SharedArticlesToday
                    },
                    title = $"Content Activity (Last {days} days)"
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"❌ Error in GetContentAnalytics: {ex.Message}");
                return Ok(new { 
                    labels = new List<string>(),
                    datasets = new object[0],
                    overallStats = new { totalSharedArticles = 0, totalReports = 0, pendingReports = 0, sharedArticlesToday = 0 },
                    title = "Content Activity (No Data)"
                });
            }
        }
    }
}
