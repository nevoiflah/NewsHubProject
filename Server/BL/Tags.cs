using Server.DAL;

namespace Server.BL
{
    public class Tags
    {
        private int id;
        private string name;

        public Tags() { }

        public Tags(int id, string name)
        {
            Id = id;
            Name = name;
        }

        // Properties
        public int Id { get => id; set => id = value; }
        public string Name { get => name; set => name = value; }

        // Static BL Methods
        public static List<Tags> GetAllTags()
        {
            TagsDBservices dbs = new TagsDBservices();
            return dbs.GetAllTags();
        }

        public static List<Tags> GetUserTags(int userId)
        {
            TagsDBservices dbs = new TagsDBservices();
            return dbs.GetUserTags(userId);
        }

        public static bool SaveUserTags(int userId, List<int> tagIds)
        {
            TagsDBservices dbs = new TagsDBservices();
            return dbs.SaveUserTags(userId, tagIds) > 0;
        }
    }
}
