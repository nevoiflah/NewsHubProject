using Server.DAL;

namespace Server.BL
{
    public class Reports
    {
        // תכונות
        private int id;
        private int newsId;
        private int userId;
        private string reason = string.Empty;
        private DateTime createdAt;
        private bool isResolved;

        // בנאי
        public Reports(int id, int newsId, int userId, string reason, DateTime createdAt, bool isResolved)
        {
            Id = id;
            NewsId = newsId;
            UserId = userId;
            Reason = reason;
            CreatedAt = createdAt;
            IsResolved = isResolved;
        }

        // Properties
        public int Id { get => id; set => id = value; }
        public int NewsId { get => newsId; set => newsId = value; }
        public int UserId { get => userId; set => userId = value; }
        public string Reason { get => reason; set => reason = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }
        public bool IsResolved { get => isResolved; set => isResolved = value; }

        // פונקציות סטטיות
        public static List<Reports> GetAllReports()
        {
            ReportsDBservices dbs = new ReportsDBservices();
            return dbs.GetAllReports();
        }

        public static bool MarkAsResolved(int reportId)
        {
            ReportsDBservices dbs = new ReportsDBservices();
            return dbs.MarkReportAsResolved(reportId) > 0;
        }
    }
}
