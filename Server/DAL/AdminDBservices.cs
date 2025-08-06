using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Server.BL;

namespace Server.DAL
{
    public class AdminDBservices
    {
        private SqlConnection connect(string conString)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json").Build();
            string cStr = configuration.GetConnectionString("myProjDB");
            SqlConnection con = new SqlConnection(cStr);
            con.Open();
            return con;
        }

        private SqlCommand CreateCommandWithStoredProcedureGeneral(string spName, SqlConnection con, Dictionary<string, object> paramDic)
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

        public int LockUser(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object> paramDic = new()
            {
                { "@UserId", userId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_LockUser", con, paramDic);
            return cmd.ExecuteNonQuery();
        }

        public int UnlockUser(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object> paramDic = new()
            {
                { "@UserId", userId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UnlockUser", con, paramDic);
            return cmd.ExecuteNonQuery();
        }

        public Admin GetSystemStats()
        {
            using SqlConnection con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSystemStats", con, null);
            SqlDataReader reader = cmd.ExecuteReader();

            if (reader.Read())
            {
                return new Admin(
                    Convert.ToInt32(reader["TotalUsers"]),
                    Convert.ToInt32(reader["TotalNewsPulled"]),
                    Convert.ToInt32(reader["TotalSavedNews"]),
                    Convert.ToInt32(reader["TotalReports"])
                );
            }

            return new Admin(0, 0, 0, 0);
        }
    }
}
