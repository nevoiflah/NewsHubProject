using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using System.Data;
using Microsoft.Extensions.Configuration;

namespace NewsHub_New_Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public NotificationController(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        [HttpPost("register-token")]
        public IActionResult RegisterToken([FromBody] FCMTokenRequest request)
        {
            try
            {
                Console.WriteLine($"🔔 Registering FCM token for user {request.UserId}: {request.Token.Substring(0, Math.Min(20, request.Token.Length))}...");
                
                using var connection = new SqlConnection(_configuration.GetConnectionString("myProjDB"));
                connection.Open();

                // First, deactivate any existing tokens for this device type and user agent
                string deactivateQuery = @"
                    UPDATE NLM_NewsHub_FCMTokens 
                    SET IsActive = 0 
                    WHERE UserId = @UserId 
                    AND DeviceType = @DeviceType 
                    AND (UserAgent = @UserAgent OR (@UserAgent IS NULL AND UserAgent IS NULL))";

                using (var command = new SqlCommand(deactivateQuery, connection))
                {
                    command.Parameters.AddWithValue("@UserId", request.UserId);
                    command.Parameters.AddWithValue("@DeviceType", request.DeviceType);
                    command.Parameters.AddWithValue("@UserAgent", request.UserAgent ?? (object)DBNull.Value);
                    command.ExecuteNonQuery();
                }

                // Then insert the new token
                string insertQuery = @"
                    INSERT INTO NLM_NewsHub_FCMTokens (UserId, Token, DeviceType, UserAgent)
                    VALUES (@UserId, @Token, @DeviceType, @UserAgent)";

                using (var command = new SqlCommand(insertQuery, connection))
                {
                    command.Parameters.AddWithValue("@UserId", request.UserId);
                    command.Parameters.AddWithValue("@Token", request.Token);
                    command.Parameters.AddWithValue("@DeviceType", request.DeviceType);
                    command.Parameters.AddWithValue("@UserAgent", request.UserAgent ?? (object)DBNull.Value);
                    command.ExecuteNonQuery();
                }
                
                Console.WriteLine($"✅ Token registered successfully for user {request.UserId}");
                // Console.WriteLine($"📱 Device: {request.DeviceType}, User Agent: {request.UserAgent}");
                
                return Ok(new { success = true, message = "Token registered successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ Error registering FCM token: {ex.Message}");
                return StatusCode(500, new { success = false, message = $"Error registering token: {ex.Message}" });
            }
        }

        [HttpPost("send-notification")]
        public async Task<IActionResult> SendNotification([FromBody] SendNotificationRequest request)
        {
            try
            {
                // Console.WriteLine($"📱 Sending notification to user {request.UserId}: {request.Title} - {request.Body}");
                
                // Get user's FCM tokens
                var tokens = new List<string>();
                using (var connection = new SqlConnection(_configuration.GetConnectionString("myProjDB")))
                {
                    connection.Open();
                    string sql = "SELECT Token FROM NLM_NewsHub_FCMTokens WHERE UserId = @UserId AND IsActive = 1";
                    using var command = new SqlCommand(sql, connection);
                    command.Parameters.AddWithValue("@UserId", request.UserId);

                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        tokens.Add(reader["Token"].ToString());
                    }
                }

                if (!tokens.Any())
                {
                    // Console.WriteLine($"⚠️ No active FCM tokens found for user {request.UserId}");
                    return Ok(new { success = false, message = "No active devices found for user" });
                }

                // Send notification to all active tokens
                var response = await FirebaseConfig.SendNotificationToMultipleTokensAsync(
                    tokens,
                    request.Title,
                    request.Body,
                    request.Data
                );

                // Console.WriteLine($"✅ Notification sent successfully to {response.SuccessCount} devices, {response.FailureCount} failed");
                
                return Ok(new { 
                    success = true, 
                    message = "Notification sent successfully",
                    successCount = response.SuccessCount,
                    failureCount = response.FailureCount
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending notification: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error sending notification" });
            }
        }

        [HttpPost("test-notification")]
        public async Task<IActionResult> TestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                // Console.WriteLine($"🧪 Testing notification for user {request.UserId}");
                
                // Get user's FCM tokens
                var tokens = new List<string>();
                using var connection = new SqlConnection(_configuration.GetConnectionString("myProjDB"));
                {
                    connection.Open();
                    string sql = "SELECT Token FROM NLM_NewsHub_FCMTokens WHERE UserId = @UserId AND IsActive = 1";
                    using var command = new SqlCommand(sql, connection);
                    command.Parameters.AddWithValue("@UserId", request.UserId);

                    using var reader = command.ExecuteReader();
                    while (reader.Read())
                    {
                        tokens.Add(reader["Token"].ToString());
                    }
                }

                if (!tokens.Any())
                {
                    // Console.WriteLine($"⚠️ No active FCM tokens found for user {request.UserId}");
                    return Ok(new { success = false, message = "No active devices found for user" });
                }

                var testData = new Dictionary<string, string>
                {
                    { "type", "test" },
                    { "timestamp", DateTime.UtcNow.ToString() }
                };

                // Send test notification to all active tokens
                var response = await FirebaseConfig.SendNotificationToMultipleTokensAsync(
                    tokens,
                    "NewsHub Test Notification",
                    request.Message,
                    testData
                );

                // Console.WriteLine($"✅ Test notification sent successfully to {response.SuccessCount} devices, {response.FailureCount} failed");
                
                return Ok(new { 
                    success = true, 
                    message = "Test notification sent successfully",
                    data = testData,
                    successCount = response.SuccessCount,
                    failureCount = response.FailureCount
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending test notification: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error sending test notification" });
            }
        }
    }

    public class FCMTokenRequest
    {
        public string Token { get; set; } = string.Empty;
        public int UserId { get; set; }
        public string DeviceType { get; set; } = "web";
        public string? UserAgent { get; set; }
    }

    public class SendNotificationRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public Dictionary<string, string>? Data { get; set; }
    }

    public class TestNotificationRequest
    {
        public int UserId { get; set; }
        public string Message { get; set; } = "Test notification";
    }
}
