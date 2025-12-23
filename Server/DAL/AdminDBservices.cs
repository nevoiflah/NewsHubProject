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


        public Admin GetSystemStats()
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetSystemStats", con, null);
                SqlDataReader reader = cmd.ExecuteReader();

                if (reader.Read())
                {
                    return new Admin(
                        reader["TotalUsers"] != DBNull.Value ? Convert.ToInt32(reader["TotalUsers"]) : 0,
                        reader["ActiveUsers"] != DBNull.Value ? Convert.ToInt32(reader["ActiveUsers"]) : 0,
                        reader["SharedArticles"] != DBNull.Value ? Convert.ToInt32(reader["SharedArticles"]) : 0,
                        reader["PendingReports"] != DBNull.Value ? Convert.ToInt32(reader["PendingReports"]) : 0
                    );
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error mapping system stats: {ex.Message}");
            }

            return new Admin(0, 0, 0, 0);
        }

        // ============================================================================
        // ANALYTICS METHODS
        // ============================================================================

        public List<(string Date, int Count)> GetDailyLoginStats(int days = 7)
        {
            var result = new List<(string Date, int Count)>();
            
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                string sql = @"
                    SELECT 
                        CAST(LastLoginDate AS DATE) as LoginDate,
                        COUNT(DISTINCT Id) as LoginCount
                    FROM NLM_NewsHub_Users 
                    WHERE LastLoginDate >= DATEADD(day, -@Days, GETDATE())
                        AND LastLoginDate IS NOT NULL
                    GROUP BY CAST(LastLoginDate AS DATE)
                    ORDER BY LoginDate DESC";
                
                SqlCommand cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Days", days);
                
                SqlDataReader reader = cmd.ExecuteReader();
                
                while (reader.Read())
                {
                    DateTime date = Convert.ToDateTime(reader["LoginDate"]);
                    int count = Convert.ToInt32(reader["LoginCount"]);
                    result.Add((date.ToString("yyyy-MM-dd"), count));
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting daily login stats: {ex.Message}");
            }
            
            return result;
        }

        public List<(string Date, int Count)> GetDailyRegistrationStats(int days = 30)
        {
            var result = new List<(string Date, int Count)>();
            
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                string sql = @"
                    SELECT 
                        CAST(RegistrationDate AS DATE) as RegDate,
                        COUNT(*) as RegCount
                    FROM NLM_NewsHub_Users 
                    WHERE RegistrationDate >= DATEADD(day, -@Days, GETDATE())
                    GROUP BY CAST(RegistrationDate AS DATE)
                    ORDER BY RegDate DESC";
                
                SqlCommand cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Days", days);
                
                SqlDataReader reader = cmd.ExecuteReader();
                
                while (reader.Read())
                {
                    DateTime date = Convert.ToDateTime(reader["RegDate"]);
                    int count = Convert.ToInt32(reader["RegCount"]);
                    result.Add((date.ToString("yyyy-MM-dd"), count));
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting daily registration stats: {ex.Message}");
            }
            
            return result;
        }

        public (int TotalUsers, int ActiveUsers, int NewUsersThisWeek, int AdminUsers) GetUserActivityStats()
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                string sql = @"
                    SELECT 
                        COUNT(*) as TotalUsers,
                        SUM(CASE WHEN ActivityLevel > 0 THEN 1 ELSE 0 END) as ActiveUsers,
                        SUM(CASE WHEN RegistrationDate >= DATEADD(week, -1, GETDATE()) THEN 1 ELSE 0 END) as NewUsersThisWeek,
                        SUM(CASE WHEN IsAdmin = 1 THEN 1 ELSE 0 END) as AdminUsers
                    FROM NLM_NewsHub_Users";
                
                SqlCommand cmd = new SqlCommand(sql, con);
                SqlDataReader reader = cmd.ExecuteReader();
                
                if (reader.Read())
                {
                    return (
                        Convert.ToInt32(reader["TotalUsers"]),
                        Convert.ToInt32(reader["ActiveUsers"]), 
                        Convert.ToInt32(reader["NewUsersThisWeek"]),
                        Convert.ToInt32(reader["AdminUsers"])
                    );
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting user activity stats: {ex.Message}");
            }
            
            return (0, 0, 0, 0, 0);
        }

        public (int TotalSharedArticles, int TotalReports, int PendingReports, int SharedArticlesToday) GetContentStats()
        {
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                string sql = @"
                    SELECT 
                        (SELECT COUNT(*) FROM NLM_NewsHub_SharedArticles WHERE IsFlagged = 0) as TotalSharedArticles,
                        (SELECT COUNT(*) FROM NLM_NewsHub_Reports) as TotalReports,
                        (SELECT COUNT(*) FROM NLM_NewsHub_Reports WHERE IsResolved = 0) as PendingReports,
                        (SELECT COUNT(*) FROM NLM_NewsHub_SharedArticles 
                         WHERE CAST(CreatedAt AS DATE) = CAST(GETDATE() AS DATE) AND IsFlagged = 0) as SharedArticlesToday";
                
                SqlCommand cmd = new SqlCommand(sql, con);
                SqlDataReader reader = cmd.ExecuteReader();
                
                if (reader.Read())
                {
                    return (
                        Convert.ToInt32(reader["TotalSharedArticles"]),
                        Convert.ToInt32(reader["TotalReports"]),
                        Convert.ToInt32(reader["PendingReports"]),
                        Convert.ToInt32(reader["SharedArticlesToday"])
                    );
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting content stats: {ex.Message}");
            }
            
            return (0, 0, 0, 0);
        }

        public List<(string Date, int SharedArticles, int Reports)> GetDailyContentStats(int days = 7)
        {
            var result = new List<(string Date, int SharedArticles, int Reports)>();
            
            try
            {
                using SqlConnection con = connect("myProjDB");
                
                string sql = @"
                    WITH DateRange AS (
                        SELECT DATEADD(day, -ROW_NUMBER() OVER (ORDER BY (SELECT 1)) + 1, CAST(GETDATE() AS DATE)) as Date
                        FROM sys.objects
                        WHERE ROW_NUMBER() OVER (ORDER BY (SELECT 1)) <= @Days
                    ),
                    SharedStats AS (
                        SELECT 
                            CAST(CreatedAt AS DATE) as Date,
                            COUNT(*) as SharedCount
                        FROM NLM_NewsHub_SharedArticles 
                        WHERE CreatedAt >= DATEADD(day, -@Days, GETDATE())
                            AND IsFlagged = 0
                        GROUP BY CAST(CreatedAt AS DATE)
                    ),
                    ReportStats AS (
                        SELECT 
                            CAST(ReportedAt AS DATE) as Date,
                            COUNT(*) as ReportCount
                        FROM NLM_NewsHub_Reports 
                        WHERE ReportedAt >= DATEADD(day, -@Days, GETDATE())
                        GROUP BY CAST(ReportedAt AS DATE)
                    )
                    SELECT 
                        dr.Date,
                        ISNULL(ss.SharedCount, 0) as SharedArticles,
                        ISNULL(rs.ReportCount, 0) as Reports
                    FROM DateRange dr
                    LEFT JOIN SharedStats ss ON dr.Date = ss.Date
                    LEFT JOIN ReportStats rs ON dr.Date = rs.Date
                    ORDER BY dr.Date DESC";
                
                SqlCommand cmd = new SqlCommand(sql, con);
                cmd.Parameters.AddWithValue("@Days", days);
                
                SqlDataReader reader = cmd.ExecuteReader();
                
                while (reader.Read())
                {
                    DateTime date = Convert.ToDateTime(reader["Date"]);
                    int sharedArticles = Convert.ToInt32(reader["SharedArticles"]);
                    int reports = Convert.ToInt32(reader["Reports"]);
                    result.Add((date.ToString("yyyy-MM-dd"), sharedArticles, reports));
                }
            }
            catch (Exception ex)
            {
                // Console.WriteLine($"Error getting daily content stats: {ex.Message}");
            }
            
            return result;
        }
    }
}
