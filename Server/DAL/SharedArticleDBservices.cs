using System.Data;
using System.Data.SqlClient;
using Server.BL;
using Microsoft.Extensions.Configuration;

namespace Server.DAL
{
    public class SharedArticleDBservices
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

        // Create shared article
        public int CreateSharedArticle(SharedArticle article, int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@UserId", userId },
                { "@Url", article.Url },
                { "@ArticleTitle", article.ArticleTitle },
                { "@ArticleDescription", article.ArticleDescription },
                { "@ArticleSource", article.ArticleSource },
                { "@ArticleImageUrl", article.ArticleImageUrl },
                { "@Comment", article.Comment },
                { "@Tags", article.Tags }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_CreateSharedArticle", con, paramDic);
            object? result = cmd.ExecuteScalar();

            return result != null && int.TryParse(result.ToString(), out int id) ? id : -1;
        }

        // Get shared articles with filters and pagination
        public List<SharedArticle> GetSharedArticles(int? userId = null, string? sortBy = "newest", int page = 1, int pageSize = 20)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@UserId", userId },
                { "@SortBy", sortBy ?? "newest" },
                { "@Page", page },
                { "@PageSize", pageSize }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSharedArticles", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<SharedArticle> list = new();

            while (reader.Read())
            {
                list.Add(MapSharedArticle(reader));
            }

            return list;
        }

        // Get shared article by ID
        public SharedArticle? GetSharedArticleById(int id, int? currentUserId = null)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@Id", id },
                { "@CurrentUserId", currentUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSharedArticleById", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            
            return reader.Read() ? MapSharedArticle(reader) : null;
        }

        // Delete shared article
        public bool DeleteSharedArticle(int id, int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@Id", id },
                { "@UserId", userId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_DeleteSharedArticle", con, paramDic);
            return cmd.ExecuteNonQuery() > 0;
        }

        // Like shared article
        public bool LikeSharedArticle(int sharedArticleId, int userId)
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                Dictionary<string, object?> paramDic = new()
                {
                    { "@SharedArticleId", sharedArticleId },
                    { "@UserId", userId }
                };

                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_LikeSharedArticle", con, paramDic);
                object result = cmd.ExecuteScalar();
                
                // The procedure returns 1 for like added, 0 for like removed
                return result != null && Convert.ToInt32(result) == 1;
            }
            catch (Exception ex)
            {
                return false;
            }
        }

        // Unlike shared article - REMOVED: Now handled by single LikeSharedArticle procedure
        // public bool UnlikeSharedArticle(int articleId, int userId) { ... }

        // Check if article is liked by user
        public bool IsLikedByUser(int articleId, int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@SharedArticleId", articleId },
                { "@UserId", userId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_IsSharedArticleLiked", con, paramDic);
            object? result = cmd.ExecuteScalar();
            
            return result != null && Convert.ToInt32(result) > 0;
        }

        // Flag/unflag shared article
        public bool FlagSharedArticle(int id, bool flagged)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@Id", id },
                { "@IsFlagged", flagged }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_FlagSharedArticle", con, paramDic);
            return cmd.ExecuteNonQuery() > 0;
        }

        // Map database reader to SharedArticle object
        private SharedArticle MapSharedArticle(SqlDataReader reader)
        {
            var article = new SharedArticle(
                Convert.ToInt32(reader["Id"]),
                Convert.ToInt32(reader["UserId"]),
                reader["Url"].ToString() ?? "",
                reader["ArticleTitle"] as string,
                reader["ArticleDescription"] as string,
                reader["ArticleSource"] as string,
                reader["ArticleImageUrl"] as string,
                reader["Comment"] as string,
                reader["Tags"] as string,
                Convert.ToDateTime(reader["CreatedAt"]),
                Convert.ToBoolean(reader["IsFlagged"]),
                Convert.ToInt32(reader["Likes"]),
                Convert.ToInt32(reader["CommentsCount"])
            );

            // Add extended properties if available
            if (reader.GetSchemaTable()?.Select($"ColumnName = 'Username'").Length > 0)
            {
                article.Username = reader["Username"] as string;
            }

            if (reader.GetSchemaTable()?.Select($"ColumnName = 'IsLikedByCurrentUser'").Length > 0)
            {
                article.IsLikedByCurrentUser = reader["IsLikedByCurrentUser"] != DBNull.Value && 
                                               Convert.ToBoolean(reader["IsLikedByCurrentUser"]);
            }

            return article;
        }
    }
}