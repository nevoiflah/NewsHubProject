using System.Data;
using System.Data.SqlClient;
using Server.BL;
using Microsoft.Extensions.Configuration;

namespace Server.DAL
{
    public class SharedDBservices
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

        private SqlCommand CreateCommandWithStoredProcedureGeneral(string spName, SqlConnection con, Dictionary<string, object?>? paramDic)
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
                foreach (var param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }
            }

            return cmd;
        }

        public int ShareArticle(SharedArticle shared, int userId)
        {
            using SqlConnection con = connect("myProjDB");

            Dictionary<string, object?> paramDic = new()
            {
                { "@UserId", userId },
                { "@Url", shared.Url },
                { "@Comment", shared.Comment },
                { "@Tags", shared.Tags != null ? string.Join(",", shared.Tags) : "" },
                { "@Title", shared.ArticleTitle },
                { "@Description", shared.ArticleDescription },
                { "@Source", shared.ArticleSource },
                { "@ImageUrl", shared.ArticleImageUrl }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_ShareArticle", con, paramDic);
            object? result = cmd.ExecuteScalar();
            return result != null && int.TryParse(result.ToString(), out int id) ? id : -1;
        }

        public List<SharedArticle> GetAllShared()
        {
            using SqlConnection con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSharedArticles", con, null);
            SqlDataReader reader = cmd.ExecuteReader();
            List<SharedArticle> list = new();

            while (reader.Read())
            {
                list.Add(MapShared(reader));
            }

            return list;
        }

        public SharedArticle? GetById(int id)
        {
            using SqlConnection con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSharedArticleById", con, new() { { "@Id", id } });
            SqlDataReader reader = cmd.ExecuteReader();

            return reader.Read() ? MapShared(reader) : null;
        }

public bool DeleteShared(int id, int userId, bool isAdmin = false)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@Id", id },
                { "@UserId", userId },
                { "@IsAdmin", isAdmin }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_DeleteSharedArticle", con, paramDic);
            return cmd.ExecuteNonQuery() > 0;
        }

        private SharedArticle MapShared(SqlDataReader reader)
        {
            string? tagsString = reader["Tags"]?.ToString();
            List<string> tagsList = string.IsNullOrEmpty(tagsString) 
                ? new List<string>() 
                : tagsString.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                
            return new SharedArticle
            {
                Id = Convert.ToInt32(reader["Id"]),
                UserId = Convert.ToInt32(reader["UserId"]),
                Url = reader["Url"].ToString() ?? "",
                ArticleTitle = reader["ArticleTitle"]?.ToString(),
                ArticleDescription = reader["ArticleDescription"]?.ToString(),
                ArticleSource = reader["ArticleSource"]?.ToString(),
                ArticleImageUrl = reader["ArticleImageUrl"]?.ToString(),
                Comment = reader["Comment"]?.ToString(),
                Tags = string.IsNullOrEmpty(tagsString) ? "" : tagsString,
                CreatedAt = Convert.ToDateTime(reader["CreatedAt"]),
                IsFlagged = Convert.ToBoolean(reader["IsFlagged"]),
                Likes = Convert.ToInt32(reader["Likes"]),
                CommentsCount = Convert.ToInt32(reader["CommentsCount"]),
                Username = reader["Username"]?.ToString(),
                ActivityLevel = reader["ActivityLevel"] != DBNull.Value ? Convert.ToInt32(reader["ActivityLevel"]) : 0
            };
        }
    }
}
