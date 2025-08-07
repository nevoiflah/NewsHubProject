using System.Data.SqlClient;
using System.Data;
using Server.BL;
using Microsoft.Extensions.Configuration;

namespace Server.DAL
{
    public class UsersDBservices
    {
        public SqlConnection connect(string conString)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json").Build();
            string cStr = configuration.GetConnectionString("myProjDB");
            SqlConnection con = new SqlConnection(cStr);
            con.Open();
            return con;
        }

        public SqlCommand CreateCommandWithStoredProcedureGeneral(string spName, SqlConnection con, Dictionary<string, object> paramDic)
        {
            SqlCommand cmd = new SqlCommand
            {
                Connection = con,
                CommandText = spName,
                CommandTimeout = 10,
                CommandType = CommandType.StoredProcedure
            };

            if (paramDic != null)
            {
                foreach (KeyValuePair<string, object> param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }
            }

            return cmd;
        }

        public int InsertUser(Users user)
        {
                SqlConnection con = null;

                try
                {
                    con = connect("myProjDB");
                    Dictionary<string, object> paramDic = new Dictionary<string, object>
            {
                { "@Username", user.Username },
                { "@Email", user.Email },
                { "@FirstName", user.FirstName },
                { "@LastName", user.LastName },
                { "@PasswordHash", user.PasswordHash },
                { "@AvatarUrl", user.AvatarUrl },
                { "@RegistrationDate", user.RegistrationDate },
                { "@IsAdmin", user.IsAdmin }
            };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_InsertUser", con, paramDic);
                object result = cmd.ExecuteScalar();

                if (result != null && int.TryParse(result.ToString(), out int newId))
                    return newId;
                return -1;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }


        public int UpdateUser(int id, Users user)
        {
            SqlConnection con = null;

            try
            {
                con = connect("myProjDB");

                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Id", id },
                    { "@Username", user.Username },
                    { "@Email", user.Email },
                    { "@FirstName", user.FirstName },
                    { "@LastName", user.LastName },
                    { "@PasswordHash", user.PasswordHash },
                    { "@NotifyOnLikes", user.NotifyOnLikes },
                    { "@NotifyOnComments", user.NotifyOnComments },
                    { "@NotifyOnFollow", user.NotifyOnFollow },
                    { "@NotifyOnShare", user.NotifyOnShare }
                };

                Console.WriteLine($"UpdateUser parameters: {string.Join(", ", paramDic.Select(kvp => $"{kvp.Key}={kvp.Value}"))}");
                
                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UpdateUser", con, paramDic);
                int result = cmd.ExecuteNonQuery();
                Console.WriteLine($"UpdateUser result: {result}");
                return result;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateUser error: {ex.Message}");
                Console.WriteLine($"UpdateUser stack trace: {ex.StackTrace}");
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public int UpdateUserSimple(int id, string username, string email, string firstName, string lastName, string passwordHash = null)
        {
            SqlConnection con = null;

            try
            {
                con = connect("myProjDB");

                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Id", id },
                    { "@Username", username },
                    { "@Email", email },
                    { "@FirstName", firstName },
                    { "@LastName", lastName },
                    { "@PasswordHash", passwordHash ?? "" },
                    { "@NotifyOnLikes", true },
                    { "@NotifyOnComments", true },
                    { "@NotifyOnFollow", true },
                    { "@NotifyOnShare", true }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UpdateUser", con, paramDic);
                return cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public int DeleteUser(int id)
        {
            SqlConnection con = null;

            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Id", id }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_DeleteUser", con, paramDic);
                return cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public Users? GetUserById(int id)
        {
            SqlConnection con = null;
            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Id", id }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetUserById", con, paramDic);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return ReadUser(reader);
                }

                return null;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public Users? GetUserByUsername(string username)
        {
            SqlConnection con = null;

            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Username", username }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetUserByUsername", con, paramDic);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return ReadUser(reader);
                }

                return null;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public Users? GetUserByEmail(string email)
        {
            SqlConnection con = null;

            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Email", email }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetUserByEmail", con, paramDic);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return ReadUser(reader);
                }

                return null;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public List<Users> GetAllUsers()
        {
            SqlConnection con = null;
            List<Users> users = new List<Users>();

            try
            {
                con = connect("myProjDB");
                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetAllUsers", con, null);
                SqlDataReader reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    users.Add(ReadUser(reader));
                }

                return users;
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public int SetUserLockState(int id, bool isLocked)
        {
            SqlConnection con = null;
            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@Id", id },
                    { "@IsLocked", isLocked }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SetUserLock", con, paramDic);
                return cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }

        public int UpdateLastLogin(int id)
        {
            SqlConnection con = null;
            try
            {
                con = connect("myProjDB");
                Dictionary<string, object> paramDic = new Dictionary<string, object>
                {
                    { "@UserId", id },
                    { "@LoginTime", DateTime.UtcNow }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UpdateLastLogin", con, paramDic);
                return cmd.ExecuteNonQuery();
            }
            catch (Exception ex)
            {
                throw ex;
            }
            finally
            {
                con?.Close();
            }
        }
        public List<string> GetUserInterests(int userId)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                Dictionary<string, object> paramDic = new() { { "@UserId", userId } };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetUserPreference", con, paramDic);
                SqlDataReader reader = cmd.ExecuteReader();
                
                List<string> interests = new();
                while (reader.Read())
                {
                    string category = reader["Category"] as string;
                    if (!string.IsNullOrEmpty(category))
                    {
                        interests.Add(category);
                    }
                }
                
                return interests;
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB error GetUserInterests: " + ex.Message);
                return new List<string>();
            }
        }

        public bool SaveUserInterests(int userId, List<string> categories)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                // Clear existing preferences first
                Dictionary<string, object> clearParamDic = new() { { "@UserId", userId } };
                SqlCommand clearCmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SaveUserPreference", con, clearParamDic);
                clearCmd.Parameters.AddWithValue("@Category", DBNull.Value);
                clearCmd.ExecuteNonQuery();
                
                // Save each category as a separate preference
                foreach (string category in categories)
                {
                    Dictionary<string, object> paramDic = new()
                    {
                        { "@UserId", userId },
                        { "@Category", category }
                    };

                    SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SaveUserPreference", con, paramDic);
                    cmd.ExecuteNonQuery();
                }
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ DB Error SaveUserInterests: " + ex.Message);
                return false;
            }
        }

        public bool DeleteUserInterests(int userId)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                Dictionary<string, object> paramDic = new() { { "@UserId", userId } };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SaveUserPreference", con, paramDic);
                cmd.Parameters.AddWithValue("@Category", DBNull.Value);
                cmd.ExecuteNonQuery();
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Error DeleteUserInterests: " + ex.Message);
                return false;
            }
        }

        public bool UpdateNotificationPreferences(int userId, bool notifyOnLikes, bool notifyOnComments, bool notifyOnFollow, bool notifyOnShare)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                Dictionary<string, object> paramDic = new()
                {
                    { "@Id", userId },
                    { "@Username", DBNull.Value }, // Keep existing username
                    { "@Email", DBNull.Value }, // Keep existing email
                    { "@FirstName", DBNull.Value }, // Keep existing first name
                    { "@LastName", DBNull.Value }, // Keep existing last name
                    { "@PasswordHash", DBNull.Value }, // Keep existing password
                    { "@NotifyOnLikes", notifyOnLikes },
                    { "@NotifyOnComments", notifyOnComments },
                    { "@NotifyOnFollow", notifyOnFollow },
                    { "@NotifyOnShare", notifyOnShare }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UpdateUser", con, paramDic);
                cmd.ExecuteNonQuery();
                
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Error UpdateNotificationPreferences: " + ex.Message);
                return false;
            }
        }

        public int UpdateUserActivity(int userId, int activityPoints = 2)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                Dictionary<string, object> paramDic = new()
                {
                    { "@UserId", userId },
                    { "@ActivityPoints", activityPoints }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UpdateUserActivity", con, paramDic);
                object result = cmd.ExecuteScalar();
                
                return result != null ? Convert.ToInt32(result) : 0;
            }
            catch (Exception ex)
            {
                Console.WriteLine("DB Error UpdateUserActivity: " + ex.Message);
                return 0;
            }
        }


        private Users ReadUser(SqlDataReader reader)
        {
            return new Users(
                Convert.ToInt32(reader["Id"]),
                reader["Username"].ToString(),
                reader["Email"].ToString(),
                reader["FirstName"].ToString(),
                reader["LastName"].ToString(),
                reader["PasswordHash"].ToString(),
                Convert.ToDateTime(reader["RegistrationDate"]),
                reader["LastLoginDate"] == DBNull.Value ? null : Convert.ToDateTime(reader["LastLoginDate"]),
                Convert.ToBoolean(reader["IsLocked"]),
                Convert.ToBoolean(reader["IsAdmin"]),
                reader["AvatarUrl"]?.ToString(),
                Convert.ToInt32(reader["ActivityLevel"]),
                Convert.ToInt32(reader["LikesReceived"]),
                Convert.ToBoolean(reader["NotifyOnLikes"]),
                Convert.ToBoolean(reader["NotifyOnComments"]),
                Convert.ToBoolean(reader["NotifyOnFollow"]),
                Convert.ToBoolean(reader["NotifyOnShare"])
            );
        }
    }
}