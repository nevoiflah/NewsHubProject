using Server.DAL;

namespace Server.BL
{
    public class Admin
    {
        // תכונות סטטיסטיקה
        private int totalUsers;
        private int totalNewsPulled;
        private int totalSavedNews;
        private int totalReports;

        // בנאי
        public Admin(int totalUsers, int totalNewsPulled, int totalSavedNews, int totalReports)
        {
            TotalUsers = totalUsers;
            TotalNewsPulled = totalNewsPulled;
            TotalSavedNews = totalSavedNews;
            TotalReports = totalReports;
        }

        // Properties
        public int TotalUsers { get => totalUsers; set => totalUsers = value; }
        public int TotalNewsPulled { get => totalNewsPulled; set => totalNewsPulled = value; }
        public int TotalSavedNews { get => totalSavedNews; set => totalSavedNews = value; }
        public int TotalReports { get => totalReports; set => totalReports = value; }

        // BL סטטיות
        public static bool LockUser(int userId)
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.LockUser(userId) == 1;
        }

        public static bool UnlockUser(int userId)
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.UnlockUser(userId) == 1;
        }

        public static Admin GetSystemStats()
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetSystemStats();
        }

        // ============================================================================
        // ANALYTICS METHODS
        // ============================================================================

        public static List<(string Date, int Count)> GetDailyLoginStats(int days = 7)
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetDailyLoginStats(days);
        }

        public static List<(string Date, int Count)> GetDailyRegistrationStats(int days = 30)
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetDailyRegistrationStats(days);
        }

        public static (int TotalUsers, int ActiveUsers, int LockedUsers, int NewUsersThisWeek, int AdminUsers) GetUserActivityStats()
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetUserActivityStats();
        }

        public static (int TotalSharedArticles, int TotalReports, int PendingReports, int SharedArticlesToday) GetContentStats()
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetContentStats();
        }

        public static List<(string Date, int SharedArticles, int Reports)> GetDailyContentStats(int days = 7)
        {
            AdminDBservices dbs = new AdminDBservices();
            return dbs.GetDailyContentStats(days);
        }
    }
}