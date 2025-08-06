// firebase/FirebaseConfig.cs
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;

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
    }
}
