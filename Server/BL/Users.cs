using System.Text;
using System.Text.RegularExpressions;
using System.Security.Cryptography;
using Konscious.Security.Cryptography;
using Server.DAL;

namespace Server.BL
{
    public class Users
    {
        private int id;
        private string username = string.Empty;
        private string email = string.Empty;
        private string firstName = string.Empty;
        private string lastName = string.Empty;
        private string passwordHash = string.Empty;
        private DateTime registrationDate;
        private DateTime? lastLoginDate;

        private bool isAdmin;
        private string? avatarUrl;
        private int activityLevel;
        private int likesReceived;
        private bool notifyOnLikes;
        private bool notifyOnComments;
        private bool notifyOnFollow;
        private bool notifyOnShare;

        public Users(int id, string username, string email, string firstName, string lastName, string passwordHash,
                     DateTime registrationDate, DateTime? lastLoginDate, bool isAdmin,
                     string? avatarUrl, int activityLevel, int likesReceived,
                     bool notifyOnLikes, bool notifyOnComments, bool notifyOnFollow, bool notifyOnShare)
        {
            Id = id;
            Username = username;
            Email = email;
            FirstName = firstName;
            LastName = lastName;
            PasswordHash = passwordHash;
            RegistrationDate = registrationDate;
            LastLoginDate = lastLoginDate;
            IsAdmin = isAdmin;
            AvatarUrl = avatarUrl;
            ActivityLevel = activityLevel;
            LikesReceived = likesReceived;
            NotifyOnLikes = notifyOnLikes;
            NotifyOnComments = notifyOnComments;
            NotifyOnFollow = notifyOnFollow;
            NotifyOnShare = notifyOnShare;
        }

        // --- Properties ---
        public int Id { get => id; set => id = value; }
        public string Username { get => username; set => username = value; }
        public string Email { get => email; set => email = value; }
        public string FirstName { get => firstName; set => firstName = value; }
        public string LastName { get => lastName; set => lastName = value; }
        public string PasswordHash { get => passwordHash; set => passwordHash = value; }
        public DateTime RegistrationDate { get => registrationDate; set => registrationDate = value; }
        public DateTime? LastLoginDate { get => lastLoginDate; set => lastLoginDate = value; }
        public bool IsAdmin { get => isAdmin; set => isAdmin = value; }
        public string? AvatarUrl { get => avatarUrl; set => avatarUrl = value; }
        public int ActivityLevel { get => activityLevel; set => activityLevel = value; }
        public int LikesReceived { get => likesReceived; set => likesReceived = value; }
        public bool NotifyOnLikes { get => notifyOnLikes; set => notifyOnLikes = value; }
        public bool NotifyOnComments { get => notifyOnComments; set => notifyOnComments = value; }
        public bool NotifyOnFollow { get => notifyOnFollow; set => notifyOnFollow = value; }
        public bool NotifyOnShare { get => notifyOnShare; set => notifyOnShare = value; }

        // --- Static Business Logic Methods ---

         public static int Register(Users user)
        {
            if (!IsValidEmail(user.Email))
                throw new ArgumentException("Invalid email address format.");

            user.PasswordHash = user.HashPassword(user.PasswordHash);
            user.RegistrationDate = DateTime.UtcNow;

            user.AvatarUrl = string.IsNullOrEmpty(user.AvatarUrl)
                ? ""
                : user.AvatarUrl;

            user.IsAdmin = false;

            user.ActivityLevel = 0;
            user.LikesReceived = 0;
            user.NotifyOnLikes = true;
            user.NotifyOnComments = true;
            user.NotifyOnFollow = true;
            user.NotifyOnShare = true;  

            UsersDBservices dbs = new UsersDBservices();
            return dbs.InsertUser(user);
        }
        static public Users? Login(string identifier, string password)
        {
            UsersDBservices dbs = new UsersDBservices();
            Users? user = dbs.GetUserByUsername(identifier);
            if (user == null)
            {
                user = dbs.GetUserByEmail(identifier);
            }

            if (user != null && user.VerifyPassword(password))
            {
                // Update last login date
                dbs.UpdateLastLogin(user.Id);
                return user;
            }

            return null;
        }

        public static bool Update(int id, Users user)
        {
            // Don't hash the password here - it should already be hashed when passed to this method
            // The controller is responsible for hashing new passwords before calling this method

            try
            {
                // Console.WriteLine($"🔍 Starting user update for ID: {id}");
                // Console.WriteLine($"🔍 User data: Username={user.Username}, Email={user.Email}");
                
                UsersDBservices dbs = new UsersDBservices();
                int result = dbs.UpdateUser(id, user);
                // Console.WriteLine($"🔍 Update result from DB: {result}");
                
                // With SET NOCOUNT ON, ExecuteNonQuery returns -1 for successful operations
                // Also accept 0 (no rows changed) and positive values (rows affected) as success
                // This covers the case where data is unchanged but operation succeeded
                bool isSuccess = (result == -1) || (result >= 0);
                // Console.WriteLine($"🔍 Update success determination: {isSuccess} (result was {result})");
                
                return isSuccess;
            }
            catch (Exception e)
            {
                Console.WriteLine($"❌ Update error: {e.Message}");
                Console.WriteLine($"❌ Update stack trace: {e.StackTrace}");
                return false;
            }
        }

        public static int ValidateUserUpdate(int id, string email, string username)
        {
            try
            {
                UsersDBservices dbs = new UsersDBservices();
                
                // Check if email exists for another user
                var existingUserByEmail = dbs.GetUserByEmail(email);
                if (existingUserByEmail != null && existingUserByEmail.Id != id)
                {
                    return -2; // Email already exists
                }

                // Check if username exists for another user
                var existingUserByUsername = dbs.GetUserByUsername(username);
                if (existingUserByUsername != null && existingUserByUsername.Id != id)
                {
                    return -1; // Username already exists
                }

                return 1; // Valid
            }
            catch (Exception e)
            {
                // Console.WriteLine(e.Message);
                return 0; // Error
            }
        }

        public static bool UpdateSimple(int id, string username, string email, string firstName, string lastName, string passwordHash = null)
        {
            if (!string.IsNullOrEmpty(passwordHash))
            {
                // Hash the password if provided
                var tempUser = new Users(0, "", "", "", "", passwordHash, DateTime.Now, null, false, "", 0, 0, true, true, true, true);
                passwordHash = tempUser.HashPassword(passwordHash);
            }

            try
            {
                UsersDBservices dbs = new UsersDBservices();
                return dbs.UpdateUserSimple(id, username, email, firstName, lastName, passwordHash) == 1;
            }
            catch (Exception e)
            {
                // Console.WriteLine($"❌ UpdateSimple error: {e.Message}");
                return false;
            }
        }

        public static int DeleteUser(int id)
        {
            UsersDBservices dbs = new UsersDBservices();
            return dbs.DeleteUser(id);
        }

        public static List<Users> GetAllUsers()
        {
            UsersDBservices dbs = new UsersDBservices();
            return dbs.GetAllUsers();
        }

        public static Users? GetUserById(int id)
        {
            UsersDBservices dbs = new UsersDBservices();
            return dbs.GetUserById(id);
        }


        public static List<string> GetUserInterests(int userId)
        {
            UsersDBservices db = new UsersDBservices();
            return db.GetUserInterests(userId);
        }
        public static bool SaveUserInterests(int userId, List<string> categories)
        {
            UsersDBservices db = new UsersDBservices();
            return db.SaveUserInterests(userId, categories);
        }

        public static bool ClearUserInterests(int userId)
        {
            UsersDBservices db = new UsersDBservices();
            return db.DeleteUserInterests(userId);
        }

        public static bool UpdateNotificationPreferences(int userId, bool notifyOnLikes, bool notifyOnComments, bool notifyOnFollow, bool notifyOnShare)
        {
            UsersDBservices db = new UsersDBservices();
            return db.UpdateNotificationPreferences(userId, notifyOnLikes, notifyOnComments, notifyOnFollow, notifyOnShare);
        }

        public static int UpdateUserActivity(int userId, int activityPoints = 2)
        {
            UsersDBservices db = new UsersDBservices();
            return db.UpdateUserActivity(userId, activityPoints);
        }


        // --- Password Security (Argon2) ---

        public string HashPassword(string password)
        {
            byte[] salt = GenerateSalt();
            var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
            {
                Salt = salt,
                DegreeOfParallelism = 8,
                MemorySize = 65536,
                Iterations = 4
            };

            byte[] hash = argon2.GetBytes(32);
            return $"{Convert.ToBase64String(salt)}:{Convert.ToBase64String(hash)}";
        }

        public bool VerifyPassword(string password)
        {
            try
            {
                if (string.IsNullOrEmpty(this.PasswordHash))
                    return false;

                string[] parts = this.PasswordHash.Split(':');
                if (parts.Length != 2)
                    return false;

                byte[] salt = Convert.FromBase64String(parts[0]);
                byte[] expectedHash = Convert.FromBase64String(parts[1]);

                var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
                {
                    Salt = salt,
                    DegreeOfParallelism = 8,
                    MemorySize = 65536,
                    Iterations = 4
                };

                byte[] actualHash = argon2.GetBytes(32);
                return actualHash.SequenceEqual(expectedHash);
            }
            catch
            {
                return false;
            }
        }

        private byte[] GenerateSalt()
        {
            byte[] salt = new byte[16];
            using (var rng = RandomNumberGenerator.Create())
            {
                rng.GetBytes(salt);
            }
            return salt;
        }

        private static bool IsValidEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            try
            {
                string pattern = @"^[^@\s]+@[^@\s]+\.[^@\s]+$";
                return Regex.IsMatch(email, pattern, RegexOptions.IgnoreCase);
            }
            catch
            {
                return false;
            }
        }

        static public int GetTotalUsersCount()
        {
            UsersDBservices dbs = new UsersDBservices();
            return dbs.GetTotalUsersCount();
        }
    }
}