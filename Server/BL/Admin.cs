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
    }
}
