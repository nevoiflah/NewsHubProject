using Server.DAL;
using System;
using System.Collections.Generic;

namespace Server.BL
{
    public class News
    {
        private int id;
        private string title = "";
        private string content = "";
        private string url = "";
        private string? urlToImage;
        private DateTime publishedAt;
        private string? source;
        private string? author;
        private string? category = "general";
        private DateTime fetchedAt;
        private int userId;
        private DateTime savedAt;
        private string? sentiment;
        private string? country;

        // --- Properties ---
        public int Id { get => id; set => id = value; }
        public string Title { get => title; set => title = value; }
        public string Content { get => content; set => content = value; }
        public string Url { get => url; set => url = value; }
        public string? UrlToImage { get => urlToImage; set => urlToImage = value; }
        public DateTime PublishedAt { get => publishedAt; set => publishedAt = value; }
        public string? Source { get => source; set => source = value; }
        public string? Author { get => author; set => author = value; }
        public string? Category { get => category; set => category = value; }
        public DateTime FetchedAt { get => fetchedAt; set => fetchedAt = value; }
        public int UserId { get => userId; set => userId = value; }
        public DateTime SavedAt { get => savedAt; set => savedAt = value; }
        public string? Sentiment { get => sentiment; set => sentiment = value; }
        public string? Country { get => country; set => country = value; }

        // --- Constructors ---
        public News() { }

        public News(int id, string title, string content, string url, string? urlToImage,
                    DateTime publishedAt, string? source, string? author, string? category,
                    DateTime fetchedAt, int userId, DateTime savedAt, string? sentiment, string? country)
        {
            Id = id;
            Title = title;
            Content = content;
            Url = url;
            UrlToImage = urlToImage;
            PublishedAt = publishedAt;
            Source = source;
            Author = author;
            Category = category;
            FetchedAt = fetchedAt;
            UserId = userId;
            SavedAt = savedAt;
            Sentiment = sentiment;
            Country = country;
        }

        // --- Static Business Logic Methods ---
        public static int SaveNews(News article, int userId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.SaveNewsItem(article, userId);
        }

        public static List<News> GetSavedNews(int userId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.GetSavedNews(userId);
        }

        public static News? GetSavedNewsById(int id, int userId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.GetSavedNewsById(id, userId);
        }

        public static bool UnsaveForUser(int userId, int newsId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.UnsaveNewsForUser(userId, newsId);
        }

        public static bool DeleteNews(int id, int userId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.UnsaveNewsForUser(userId, id);
        }

        public static List<News> GetLatestNews()
        {
            NewsDBservices db = new NewsDBservices();
            return db.GetLatestNews(20); // You can adjust number of articles
        }

        public static News? GetNewsById(int id)
        {
            return GetSavedNewsById(id, 1); // fallback user for old logic
        }

        public static int SaveNews(News article)
        {
            return SaveNews(article, 1); // fallback user
        }

        public static bool Report(int newsId, int userId, string reason)
        {
            NewsDBservices db = new NewsDBservices();
            return db.ReportNews(newsId, userId, reason);
        }

        public static bool SaveForUser(int userId, int newsId)
        {
            NewsDBservices db = new NewsDBservices();
            return db.SaveNewsForUser(userId, newsId);
        }

        public static int GetTotalSavedNewsCount()
        {
            UsersDBservices dbs = new UsersDBservices();
            // Note: We are using UsersDBservices to query the saved count directly as implemented there
            return dbs.GetTotalSavedNewsCount();
        }
    }
}
