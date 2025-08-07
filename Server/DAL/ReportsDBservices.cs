using Microsoft.Extensions.Configuration;
using Server.BL;
using System.Data;
using System.Data.SqlClient;

namespace Server.DAL
{
    public class ReportsDBservices
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
                foreach (var param in paramDic)
                {
                    cmd.Parameters.AddWithValue(param.Key, param.Value ?? DBNull.Value);
                }
            }

            return cmd;
        }

        public List<Reports> GetAllReports()
        {
            List<Reports> reportsList = new List<Reports>();
            using SqlConnection con = connect("myProjDB");
            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_GetAllReports", con, null);
            SqlDataReader reader = cmd.ExecuteReader();

            while (reader.Read())
            {
                Reports report = new Reports(
                    Convert.ToInt32(reader["Id"]),
                    Convert.ToInt32(reader["NewsId"]),
                    Convert.ToInt32(reader["UserId"]),
                    reader["Reason"].ToString(),
                    Convert.ToDateTime(reader["ReportedAt"]),
                    Convert.ToBoolean(reader["IsResolved"])
                );
                reportsList.Add(report);
            }

            return reportsList;
        }

        public int MarkReportAsResolved(int reportId)
        {
            using SqlConnection con = connect("myProjDB");
            Dictionary<string, object> paramDic = new()
            {
                { "@ReportId", reportId }
            };

            SqlCommand cmd = CreateCommandWithStoredProcedureGeneral("NLM_NewsHub_MarkReportAsResolved", con, paramDic);
            return cmd.ExecuteNonQuery();
        }
    }
}
