using System;
using System.Collections.Generic;
using Server.DAL;

namespace Server.BL
{
    public class SharedArticle
    {
        private int id;
        private int userId;
        private string url = "";
        private string? articleTitle;
        private string? articleDescription;
        private string? articleSource;
        private string? articleImageUrl;
        private string? comment;
        private string? tags;
        private DateTime createdAt;
        private bool isFlagged;
        private int likes;
        private int commentsCount;

        // Properties
        public int Id { get => id; set => id = value; }
        public int UserId { get => userId; set => userId = value; }
        public string Url { get => url; set => url = value; }
        public string? ArticleTitle { get => articleTitle; set => articleTitle = value; }
        public string? ArticleDescription { get => articleDescription; set => articleDescription = value; }
        public string? ArticleSource { get => articleSource; set => articleSource = value; }
        public string? ArticleImageUrl { get => articleImageUrl; set => articleImageUrl = value; }
        public string? Comment { get => comment; set => comment = value; }
        public string? Tags { get => tags; set => tags = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }
        public bool IsFlagged { get => isFlagged; set => isFlagged = value; }
        public int Likes { get => likes; set => likes = value; }
        public int CommentsCount { get => commentsCount; set => commentsCount = value; }

        // Extended properties for API responses
        public string? Username { get; set; }
        public bool IsLikedByCurrentUser { get; set; }
        public int ActivityLevel { get; set; }

        // Constructors
        public SharedArticle() { }

        public SharedArticle(int id, int userId, string url, string? articleTitle, string? articleDescription,
                            string? articleSource, string? articleImageUrl, string? comment, string? tags,
                            DateTime createdAt, bool isFlagged, int likes, int commentsCount)
        {
            Id = id;
            UserId = userId;
            Url = url;
            ArticleTitle = articleTitle;
            ArticleDescription = articleDescription;
            ArticleSource = articleSource;
            ArticleImageUrl = articleImageUrl;
            Comment = comment;
            Tags = tags;
            CreatedAt = createdAt;
            IsFlagged = isFlagged;
            Likes = likes;
            CommentsCount = commentsCount;
        }

        // Static Methods
        public static int CreateSharedArticle(SharedArticle article, int userId)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.CreateSharedArticle(article, userId);
        }

        public static List<SharedArticle> GetSharedArticles(int? userId = null, string? sortBy = "newest", int page = 1, int pageSize = 20)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.GetSharedArticles(userId, sortBy, page, pageSize);
        }

        public static SharedArticle? GetSharedArticleById(int id, int? currentUserId = null)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.GetSharedArticleById(id, currentUserId);
        }

        public static bool DeleteSharedArticle(int id, int userId, bool isAdmin = false)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.DeleteSharedArticle(id, userId, isAdmin);
        }

        public static bool LikeSharedArticle(int articleId, int userId)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.LikeSharedArticle(articleId, userId);
        }

        public static bool IsLikedByUser(int articleId, int userId)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.IsLikedByUser(articleId, userId);
        }

        public static bool FlagSharedArticle(int id, bool flagged)
        {
            SharedArticleDBservices db = new SharedArticleDBservices();
            return db.FlagSharedArticle(id, flagged);
        }
    }
}