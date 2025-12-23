using System.Data.SqlClient;
using NewsHub_New_Server;
using FirebaseAdmin.Messaging;

using Microsoft.Extensions.Configuration;

namespace Server.BL
{
    public static class NotificationService
    {
        private static string GetConnectionString()
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json").Build();
            return configuration.GetConnectionString("myProjDB");
        }

        public static async Task SendLikeNotification(int targetUserId, int likerUserId, string likerUsername, string articleTitle)
        {
            try
            {
                // Check if user wants to receive like notifications
                if (!ShouldSendNotification(targetUserId, "NotifyOnLikes"))
                    return;

                var title = "New Like!";
                var body = $"{likerUsername} liked your article: {articleTitle}";

                await SendNotificationToUser(targetUserId, title, body, new Dictionary<string, string>
                {
                    { "type", "like" },
                    { "likerId", likerUserId.ToString() },
                    { "likerUsername", likerUsername },
                    { "articleTitle", articleTitle }
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending like notification: {ex.Message}");
            }
        }

        public static async Task SendCommentNotification(int targetUserId, int commenterUserId, string commenterUsername, string articleTitle)
        {
            try
            {
                // Check if user wants to receive comment notifications
                if (!ShouldSendNotification(targetUserId, "NotifyOnComments"))
                    return;

                var title = "New Comment!";
                var body = $"{commenterUsername} commented on your article: {articleTitle}";

                await SendNotificationToUser(targetUserId, title, body, new Dictionary<string, string>
                {
                    { "type", "comment" },
                    { "commenterId", commenterUserId.ToString() },
                    { "commenterUsername", commenterUsername },
                    { "articleTitle", articleTitle }
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending comment notification: {ex.Message}");
            }
        }

        public static async Task SendFollowNotification(int targetUserId, int followerUserId, string followerUsername)
        {
            try
            {
                // Check if user wants to receive follow notifications
                if (!ShouldSendNotification(targetUserId, "NotifyOnFollow"))
                    return;

                var title = "New Follower!";
                var body = $"{followerUsername} started following you";

                await SendNotificationToUser(targetUserId, title, body, new Dictionary<string, string>
                {
                    { "type", "follow" },
                    { "followerId", followerUserId.ToString() },
                    { "followerUsername", followerUsername }
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending follow notification: {ex.Message}");
            }
        }

        public static async Task SendShareNotification(int targetUserId, string sharerUsername, string articleTitle)
        {
            try
            {
                // Check if user wants to receive share notifications
                if (!ShouldSendNotification(targetUserId, "NotifyOnShare"))
                    return;

                var title = "New Share!";
                var body = $"{sharerUsername} shared an article: {articleTitle}";

                await SendNotificationToUser(targetUserId, title, body, new Dictionary<string, string>
                {
                    { "type", "share" },
                    { "sharerUsername", sharerUsername },
                    { "articleTitle", articleTitle }
                });
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending share notification: {ex.Message}");
            }
        }

        private static bool ShouldSendNotification(int userId, string preferenceField)
        {
            try
            {
                using var connection = new SqlConnection(GetConnectionString());
                connection.Open();

                string sql = $"SELECT {preferenceField} FROM NLM_NewsHub_Users WHERE Id = @UserId";
                using var command = new SqlCommand(sql, connection);
                command.Parameters.AddWithValue("@UserId", userId);

                var result = command.ExecuteScalar();
                return result != null && Convert.ToBoolean(result);
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error checking notification preference: {ex.Message}");
                return false;
            }
        }

        private static async Task SendNotificationToUser(int userId, string title, string body, Dictionary<string, string> data = null)
        {
            try
            {
                // Get user's FCM tokens
                var tokens = GetUserFCMTokens(userId);
                if (!tokens.Any())
                {
                    // Console.WriteLine($"No FCM tokens found for user {userId}");
                    return;
                }

                // Send notification to each token
                foreach (var token in tokens)
                {
                    try
                    {
                        await FirebaseConfig.SendNotificationAsync(token, title, body, data);
                        // Console.WriteLine($"✅ Notification sent to user {userId}: {title}");
                    }
                    catch (Exception ex)
                    {
                        // Console.WriteLine($"❌ Error sending notification to token {token}: {ex.Message}");
                    }
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending notification to user {userId}: {ex.Message}");
            }
        }

        private static List<string> GetUserFCMTokens(int userId)
        {
            var tokens = new List<string>();
            try
            {
                using var connection = new SqlConnection(GetConnectionString());
                connection.Open();

                string sql = "SELECT Token FROM NLM_NewsHub_FCMTokens WHERE UserId = @UserId AND IsActive = 1";
                using var command = new SqlCommand(sql, connection);
                command.Parameters.AddWithValue("@UserId", userId);

                using var reader = command.ExecuteReader();
                while (reader.Read())
                {
                    tokens.Add(reader["Token"].ToString());
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting FCM tokens: {ex.Message}");
            }
            return tokens;
        }
    }
}
