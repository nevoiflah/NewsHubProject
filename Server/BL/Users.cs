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
        private string username;
        private string email;
        private string firstName;
        private string lastName;
        private string passwordHash;
        private DateTime registrationDate;
        private DateTime? lastLoginDate;
        private bool isLocked;
        private bool isAdmin;
        private string? avatarUrl;
        private int activityLevel;
        private int likesReceived;
        private bool notifyOnLikes;
        private bool notifyOnComments;
        private bool notifyOnFollow;
        private bool notifyOnShare;

        public Users(int id, string username, string email, string firstName, string lastName, string passwordHash,
                     DateTime registrationDate, DateTime? lastLoginDate, bool isLocked, bool isAdmin,
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
            IsLocked = isLocked;
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
        public bool IsLocked { get => isLocked; set => isLocked = value; }
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
            user.IsLocked = false;
            user.ActivityLevel = 0;
            user.LikesReceived = 0;
            user.NotifyOnLikes = true;
            user.NotifyOnComments = true;
            user.NotifyOnFollow = true;
            user.NotifyOnShare = true;

            UsersDBservices dbs = new UsersDBservices();
            return dbs.InsertUser(user);
        }

        public static Users? Login(string username, string password)
        {
            UsersDBservices dbs = new UsersDBservices();
            Users? user = dbs.GetUserByUsername(username);

            if (user != null && user.VerifyPassword(password))
            {
                dbs.UpdateLastLogin(user.Id);
                return user;
            }

            return null;
        }

        public static bool Update(int id, Users user)
        {
            if (!string.IsNullOrEmpty(user.PasswordHash))
            {
                user.PasswordHash = user.HashPassword(user.PasswordHash);
            }

            try
            {
                UsersDBservices dbs = new UsersDBservices();
                return dbs.UpdateUser(id, user) == 1;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
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

        public static int SetUserLock(int id, bool isLocked)
        {
            UsersDBservices dbs = new UsersDBservices();
            return dbs.SetUserLockState(id, isLocked);
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
            using (var rng = new RNGCryptoServiceProvider())
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
    }
}
