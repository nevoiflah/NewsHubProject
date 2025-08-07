using System.Data;
using System.Data.SqlClient;
using Server.BL;
using Microsoft.Extensions.Configuration;


namespace Server.DAL
{
    public class NewsDBservices
    {
        private SqlConnection connect(string conString)
        {
            IConfigurationRoot configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();

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
                foreach (var param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }
            }

            return cmd;
        }

        // --- Save ---
        public int SaveNewsItem(News news, int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object> paramDic = new()
            {
                { "@Title", news.Title },
                { "@Content", news.Content },
                { "@Url", news.Url },
                { "@UrlToImage", news.UrlToImage },
                { "@PublishedAt", news.PublishedAt },
                { "@Source", news.Source },
                { "@Author", news.Author },
                { "@Category", news.Category ?? "general" },
                { "@UserId", userId },
                { "@Sentiment", news.Sentiment },
                { "@Country", news.Country }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SaveNewsItem", con, paramDic);
            object? result = cmd.ExecuteScalar();

            return result != null && int.TryParse(result.ToString(), out int id) ? id : -1;
        }

        // --- Get ---
        public List<News> GetSavedNews(int userId)
        {
            using SqlConnection con = connect("myProjDB");

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSavedNews", con,
                new Dictionary<string, object> { { "@UserId", userId } });

            SqlDataReader reader = cmd.ExecuteReader();
            List<News> list = new();

            while (reader.Read())
            {
                list.Add(MapNews(reader));
            }

            return list;
        }

        public News? GetSavedNewsById(int id, int userId)
        {
            using SqlConnection con = connect("myProjDB");

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSavedNewsById", con,
                new Dictionary<string, object>
                {
                    { "@Id", id },
                    { "@UserId", userId }
                });

            SqlDataReader reader = cmd.ExecuteReader();
            return reader.Read() ? MapNews(reader) : null;
        }

        public List<News> GetLatestNews(int count)
        {
            // Future implementation
            return new List<News>();
        }

        // --- Delete ---
        public bool UnsaveNewsForUser(int userId, int newsId)
        {
            using SqlConnection con = connect("myProjDB");

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UnsaveNewsForUser", con,
                new Dictionary<string, object>
                {
                    { "@UserId", userId },
                    { "@NewsId", newsId }
                });

            return cmd.ExecuteNonQuery() > 0;
        }
        public bool ReportNews(int newsId, int userId, string reason)
        {
            using SqlConnection con = connect("myProjDB");

            Dictionary<string, object> paramDic = new()
    {
        { "@NewsId", newsId },
        { "@UserId", userId },
        { "@Reason", reason }
    };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_ReportNews", con, paramDic);
            return cmd.ExecuteNonQuery() > 0;
        }

        public bool SaveNewsForUser(int userId, int newsId)
        {
            using SqlConnection con = connect("myProjDB");

            Dictionary<string, object> paramDic = new()
    {
        { "@UserId", userId },
        { "@NewsId", newsId }
    };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_SaveNewsForUser", con, paramDic);
            return cmd.ExecuteNonQuery() > 0;
        }

        // --- Backward compatibility ---
        public int SaveNewsItem(News news) => SaveNewsItem(news, 1);
        public News? GetNewsById(int id) => GetSavedNewsById(id, 1);
        public bool DeleteNewsItem(int id) => UnsaveNewsForUser(1, id);

        // --- Mapping ---
        private News MapNews(SqlDataReader reader)
        {
            return new News(
                Convert.ToInt32(reader["Id"]),
                reader["Title"].ToString() ?? "",
                reader["Content"].ToString() ?? "",
                reader["Url"].ToString() ?? "",
                reader["UrlToImage"] as string,
                Convert.ToDateTime(reader["PublishedAt"]),
                reader["Source"] as string,
                reader["Author"] as string,
                reader["Category"] as string,
                reader["FetchedAt"] != DBNull.Value ? Convert.ToDateTime(reader["FetchedAt"]) : DateTime.UtcNow,
                Convert.ToInt32(reader["UserId"]),
                reader["SavedAt"] != DBNull.Value ? Convert.ToDateTime(reader["SavedAt"]) : DateTime.UtcNow,
                reader["Sentiment"] as string,
                reader["Country"] as string
            );
        }
    }
}
