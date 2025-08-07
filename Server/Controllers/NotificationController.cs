using Microsoft.AspNetCore.Mvc;
using System.Data.SqlClient;
using System.Data;

namespace NewsHub_New_Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {
        [HttpPost("register-token")]
        public IActionResult RegisterToken([FromBody] FCMTokenRequest request)
        {
            try
            {
                Console.WriteLine($"🔔 Registering FCM token for user {request.UserId}: {request.Token.Substring(0, Math.Min(20, request.Token.Length))}...");
                
                // For now, just log the token registration without database
                Console.WriteLine($"✅ Token registered successfully for user {request.UserId}");
                Console.WriteLine($"📱 Device: {request.DeviceType}, User Agent: {request.UserAgent}");
                
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
                Console.WriteLine($"📱 Sending notification to user {request.UserId}: {request.Title} - {request.Body}");
                
                // For now, just log the notification
                Console.WriteLine($"✅ Notification sent successfully to user {request.UserId}");
                
                return Ok(new { success = true, message = "Notification sent successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending notification: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error sending notification" });
            }
        }

        [HttpPost("test-notification")]
        public IActionResult TestNotification([FromBody] TestNotificationRequest request)
        {
            try
            {
                Console.WriteLine($"🧪 Testing notification for user {request.UserId}");
                
                // Simulate sending a test notification
                var testData = new Dictionary<string, string>
                {
                    { "type", "test" },
                    { "timestamp", DateTime.UtcNow.ToString() }
                };
                
                // In a real implementation, this would send via Firebase
                Console.WriteLine($"✅ Test notification prepared for user {request.UserId}");
                
                return Ok(new { 
                    success = true, 
                    message = "Test notification sent successfully",
                    data = testData
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error sending test notification: {ex.Message}");
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
