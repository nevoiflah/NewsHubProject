using System.Data;
using System.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Server.BL;

namespace Server.DAL
{
    public class TagsDBservices
    {
        private SqlConnection connect(string conString)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json").Build();
            string cStr = configuration.GetConnectionString(conString);
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

        public List<Tags> GetAllTags()
        {
            List<Tags> list = new List<Tags>();
            using SqlConnection con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetAllTags", con, null);
            SqlDataReader reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                list.Add(new Tags(Convert.ToInt32(reader["Id"]), reader["Name"].ToString()));
            }

            return list;
        }

        public List<Tags> GetUserTags(int userId)
        {
            List<Tags> list = new List<Tags>();
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object> paramDic = new()
            {
                { "@UserId", userId }
            };
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetUserTags", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                list.Add(new Tags(Convert.ToInt32(reader["Id"]), reader["Name"].ToString()));
            }

            return list;
        }

        public int SaveUserTags(int userId, List<int> tagIds)
        {
            using SqlConnection con = connect("myProjDB");

            // Delete existing user-tag links
            Dictionary<string, object> deleteParams = new()
            {
                { "@UserId", userId }
            };
            SqlCommand deleteCmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_ClearUserTags", con, deleteParams);
            deleteCmd.ExecuteNonQuery();

            // Insert new tag links
            int count = 0;
            foreach (int tagId in tagIds)
            {
                Dictionary<string, object> insertParams = new()
                {
                    { "@UserId", userId },
                    { "@TagId", tagId }
                };
                SqlCommand insertCmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_AddUserTag", con, insertParams);
                count += insertCmd.ExecuteNonQuery();
            }

            return count;
        }
    }
}
