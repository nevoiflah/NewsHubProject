// firebase/FirebaseConfig.cs
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using FirebaseAdmin.Messaging;

namespace NewsHub_New_Server
{
    public static class FirebaseConfig
    {
        public static void Init()
        {
            if (FirebaseApp.DefaultInstance == null)
            {
                FirebaseApp.Create(new AppOptions()
                {
                    Credential = GoogleCredential.FromFile("firebase/firebase-admin-sdk.json")
                });
            }
        }

        public static async Task<string> SendNotificationAsync(string token, string title, string body, Dictionary<string, string> data = null)
        {
            try
            {
                var message = new Message()
                {
                    Token = token,
                    Notification = new Notification()
                    {
                        Title = title,
                        Body = body
                    },
                    Data = data
                };

                var response = await FirebaseMessaging.DefaultInstance.SendAsync(message);
                // Console.WriteLine($"Successfully sent notification: {response}");
                return response;
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending notification: {ex.Message}");
                throw;
            }
        }

        public static async Task<BatchResponse> SendNotificationToMultipleTokensAsync(List<string> tokens, string title, string body, Dictionary<string, string> data = null)
        {
            try
            {
                var messages = tokens.Select(token => new Message()
                {
                    Token = token,
                    Notification = new Notification()
                    {
                        Title = title,
                        Body = body
                    },
                    Data = data
                }).ToList();

                var response = await FirebaseMessaging.DefaultInstance.SendAllAsync(messages);
                // Console.WriteLine($"Successfully sent {response.SuccessCount} notifications, {response.FailureCount} failed");
                return response;
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error sending notifications: {ex.Message}");
                throw;
            }
        }
    }
}
