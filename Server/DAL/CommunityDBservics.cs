using System.Data;
using System.Data.SqlClient;
using Server.BL;
using Microsoft.Extensions.Configuration;

namespace Server.DAL
{
    public class CommunityDBservices
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

        // ==================== COMMENTS ====================

        public int CreateComment(SharedArticleComment comment)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@SharedArticleId", comment.SharedArticleId },
                { "@UserId", comment.UserId },
                { "@Content", comment.Content }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_CreateComment", con, paramDic);
            object? result = cmd.ExecuteScalar();

            return result != null && int.TryParse(result.ToString(), out int id) ? id : -1;
        }

        public List<SharedArticleComment> GetCommentsByArticleId(int articleId, int? currentUserId = null)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@SharedArticleId", articleId },
                { "@CurrentUserId", currentUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetCommentsByArticleId", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<SharedArticleComment> list = new();

            while (reader.Read())
            {
                var comment = new SharedArticleComment(
                    Convert.ToInt32(reader["Id"]),
                    Convert.ToInt32(reader["SharedArticleId"]),
                    Convert.ToInt32(reader["UserId"]),
                    reader["Content"].ToString() ?? "",
                    Convert.ToDateTime(reader["CreatedAt"]),
                    Convert.ToBoolean(reader["IsDeleted"])
                );

                // Add extended properties
                comment.Username = reader["Username"] as string;
                comment.CanDelete = currentUserId.HasValue && 
                    (Convert.ToInt32(reader["UserId"]) == currentUserId.Value || 
                     (reader["IsAdmin"] != DBNull.Value && Convert.ToBoolean(reader["IsAdmin"])));

                list.Add(comment);
            }

            return list;
        }

        public bool DeleteComment(int commentId, int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@CommentId", commentId },
                { "@UserId", userId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_DeleteComment", con, paramDic);
            object? result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) > 0;
        }

        // ==================== USER FOLLOWS ====================

        public bool FollowUser(int followerUserId, int followedUserId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@FollowerUserId", followerUserId },
                { "@FollowedUserId", followedUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_FollowUser", con, paramDic);
            object result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) == 1;
        }

        public bool UnfollowUser(int followerUserId, int followedUserId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@FollowerUserId", followerUserId },
                { "@FollowedUserId", followedUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UnfollowUser", con, paramDic);
            object result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) > 0;
        }

        public bool IsFollowing(int followerUserId, int followedUserId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@FollowerUserId", followerUserId },
                { "@FollowedUserId", followedUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_IsFollowing", con, paramDic);
            object? result = cmd.ExecuteScalar();
            
            return result != null && Convert.ToInt32(result) > 0;
        }

        public List<UserFollow> GetFollowing(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new() { { "@UserId", userId } };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetFollowing", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<UserFollow> list = new();

            while (reader.Read())
            {
                var follow = new UserFollow(
                    Convert.ToInt32(reader["Id"]),
                    Convert.ToInt32(reader["FollowerUserId"]),
                    Convert.ToInt32(reader["FollowedUserId"]),
                    Convert.ToDateTime(reader["FollowedAt"])
                );
                follow.FollowedUsername = reader["FollowedUsername"] as string;
                list.Add(follow);
            }

            return list;
        }

        public List<UserFollow> GetFollowers(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new() { { "@UserId", userId } };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetFollowers", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<UserFollow> list = new();

            while (reader.Read())
            {
                var follow = new UserFollow(
                    Convert.ToInt32(reader["Id"]),
                    Convert.ToInt32(reader["FollowerUserId"]),
                    Convert.ToInt32(reader["FollowedUserId"]),
                    Convert.ToDateTime(reader["FollowedAt"])
                );
                follow.FollowerUsername = reader["FollowerUsername"] as string;
                list.Add(follow);
            }

            return list;
        }

        public Dictionary<string, int> GetFollowStats(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new() { { "@UserId", userId } };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetFollowStats", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            
            Dictionary<string, int> stats = new()
            {
                { "following", 0 },
                { "followers", 0 }
            };

            if (reader.Read())
            {
                stats["following"] = Convert.ToInt32(reader["FollowingCount"]);
                stats["followers"] = Convert.ToInt32(reader["FollowersCount"]);
            }

            return stats;
        }

        // ==================== USER BLOCKS ====================

        public bool BlockUser(int blockerUserId, int blockedUserId, string? reason = null)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@BlockerUserId", blockerUserId },
                { "@BlockedUserId", blockedUserId },
                { "@Reason", reason }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_BlockUser", con, paramDic);
            object? result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) == 1;
        }

        public bool UnblockUser(int blockerUserId, int blockedUserId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@BlockerUserId", blockerUserId },
                { "@BlockedUserId", blockedUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_UnblockUser", con, paramDic);
            object? result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) > 0;
        }

        public bool IsBlocked(int blockerUserId, int blockedUserId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@BlockerUserId", blockerUserId },
                { "@BlockedUserId", blockedUserId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_IsBlocked", con, paramDic);
            object? result = cmd.ExecuteScalar();
            
            return result != null && Convert.ToInt32(result) > 0;
        }

        public List<UserBlock> GetBlockedUsers(int userId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new() { { "@UserId", userId } };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetBlockedUsers", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<UserBlock> list = new();

            while (reader.Read())
            {
                var block = new UserBlock(
                    Convert.ToInt32(reader["Id"]),
                    Convert.ToInt32(reader["BlockerUserId"]),
                    Convert.ToInt32(reader["BlockedUserId"]),
                    Convert.ToDateTime(reader["BlockedAt"]),
                    reader["Reason"] as string
                );
                block.BlockedUsername = reader["BlockedUsername"] as string;
                list.Add(block);
            }

            return list;
        }

        // ==================== REPORTS ====================

        public bool ReportContent(int userId, string contentType, int contentId, string reason)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@UserId", userId },
                { "@ContentType", contentType },
                { "@ContentId", contentId },
                { "@Reason", reason }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_ReportContent", con, paramDic);
            object result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) == 1;
        }

        public List<Report> GetReports(bool? resolved = null)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new() { { "@Resolved", resolved } };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetReports", con, paramDic);
            SqlDataReader reader = cmd.ExecuteReader();
            List<Report> list = new();

            while (reader.Read())
            {
                var report = new Report(
                    Convert.ToInt32(reader["Id"]),
                    reader["NewsId"] == DBNull.Value ? 0 : Convert.ToInt32(reader["NewsId"]),
                    Convert.ToInt32(reader["UserId"]),
                    reader["Reason"] as string,
                    Convert.ToDateTime(reader["ReportedAt"]),
                    Convert.ToBoolean(reader["IsResolved"])
                );

                // Extended properties
                report.ReporterUsername = reader["ReporterUsername"] as string;
                report.ContentTitle = reader["ContentTitle"] as string;
                report.ContentType = reader["ContentType"] as string;
                if (reader["SharedArticleId"] != DBNull.Value)
                {
                    report.SharedArticleId = Convert.ToInt32(reader["SharedArticleId"]);
                }

                list.Add(report);
            }

            return list;
        }

        public bool ResolveReport(int reportId, bool resolved)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object?> paramDic = new()
            {
                { "@ReportId", reportId },
                { "@IsResolved", resolved }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_ResolveReport", con, paramDic);
            object? result = cmd.ExecuteScalar();
            return result != null && Convert.ToInt32(result) > 0;
        }
    }
}