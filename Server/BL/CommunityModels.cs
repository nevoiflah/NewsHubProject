using System;
using System.Collections.Generic;
using Server.DAL;

namespace Server.BL
{
    // Comment Model
    public class SharedArticleComment
    {
        private int id;
        private int sharedArticleId;
        private int userId;
        private string content = "";
        private DateTime createdAt;
        private bool isDeleted;

        // Properties
        public int Id { get => id; set => id = value; }
        public int SharedArticleId { get => sharedArticleId; set => sharedArticleId = value; }
        public int UserId { get => userId; set => userId = value; }
        public string Content { get => content; set => content = value; }
        public DateTime CreatedAt { get => createdAt; set => createdAt = value; }
        public bool IsDeleted { get => isDeleted; set => isDeleted = value; }

        // Extended properties for API responses
        public string? Username { get; set; }
        public bool CanDelete { get; set; }

        // Constructors
        public SharedArticleComment() { }

        public SharedArticleComment(int id, int sharedArticleId, int userId, string content, DateTime createdAt, bool isDeleted)
        {
            Id = id;
            SharedArticleId = sharedArticleId;
            UserId = userId;
            Content = content;
            CreatedAt = createdAt;
            IsDeleted = isDeleted;
        }

        // Static Methods
        public static int CreateComment(SharedArticleComment comment)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.CreateComment(comment);
        }

        public static List<SharedArticleComment> GetCommentsByArticleId(int articleId, int? currentUserId = null)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetCommentsByArticleId(articleId, currentUserId);
        }

        public static bool DeleteComment(int commentId, int userId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.DeleteComment(commentId, userId);
        }
    }

    // User Follow Model
    public class UserFollow
    {
        private int id;
        private int followerUserId;
        private int followedUserId;
        private DateTime followedAt;

        // Properties
        public int Id { get => id; set => id = value; }
        public int FollowerUserId { get => followerUserId; set => followerUserId = value; }
        public int FollowedUserId { get => followedUserId; set => followedUserId = value; }
        public DateTime FollowedAt { get => followedAt; set => followedAt = value; }

        // Extended properties
        public string? FollowerUsername { get; set; }
        public string? FollowedUsername { get; set; }

        // Constructors
        public UserFollow() { }

        public UserFollow(int id, int followerUserId, int followedUserId, DateTime followedAt)
        {
            Id = id;
            FollowerUserId = followerUserId;
            FollowedUserId = followedUserId;
            FollowedAt = followedAt;
        }

        // Static Methods
        public static bool FollowUser(int followerUserId, int followedUserId)
        {
            if (followerUserId == followedUserId) return false; // Can't follow yourself

            CommunityDBservices db = new CommunityDBservices();
            return db.FollowUser(followerUserId, followedUserId);
        }

        public static bool UnfollowUser(int followerUserId, int followedUserId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.UnfollowUser(followerUserId, followedUserId);
        }

        public static bool IsFollowing(int followerUserId, int followedUserId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.IsFollowing(followerUserId, followedUserId);
        }

        public static List<UserFollow> GetFollowing(int userId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetFollowing(userId);
        }

        public static List<UserFollow> GetFollowers(int userId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetFollowers(userId);
        }

        public static Dictionary<string, int> GetFollowStats(int userId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetFollowStats(userId);
        }
    }

    // User Block Model
    public class UserBlock
    {
        private int id;
        private int blockerUserId;
        private int blockedUserId;
        private DateTime blockedAt;
        private string? reason;

        // Properties
        public int Id { get => id; set => id = value; }
        public int BlockerUserId { get => blockerUserId; set => blockerUserId = value; }
        public int BlockedUserId { get => blockedUserId; set => blockedUserId = value; }
        public DateTime BlockedAt { get => blockedAt; set => blockedAt = value; }
        public string? Reason { get => reason; set => reason = value; }

        // Extended properties
        public string? BlockedUsername { get; set; }

        // Constructors
        public UserBlock() { }

        public UserBlock(int id, int blockerUserId, int blockedUserId, DateTime blockedAt, string? reason)
        {
            Id = id;
            BlockerUserId = blockerUserId;
            BlockedUserId = blockedUserId;
            BlockedAt = blockedAt;
            Reason = reason;
        }

        // Static Methods
        public static bool BlockUser(int blockerUserId, int blockedUserId, string? reason = null)
        {
            if (blockerUserId == blockedUserId) return false; // Can't block yourself

            CommunityDBservices db = new CommunityDBservices();
            return db.BlockUser(blockerUserId, blockedUserId, reason);
        }

        public static bool UnblockUser(int blockerUserId, int blockedUserId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.UnblockUser(blockerUserId, blockedUserId);
        }

        public static bool IsBlocked(int blockerUserId, int blockedUserId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.IsBlocked(blockerUserId, blockedUserId);
        }

        public static List<UserBlock> GetBlockedUsers(int userId)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetBlockedUsers(userId);
        }
    }

    // Report Model (extending existing functionality)
    public class Report
    {
        private int id;
        private int newsId;
        private int userId;
        private string? reason;
        private DateTime reportedAt;
        private bool isResolved;

        // Additional properties for shared articles
        public int? SharedArticleId { get; set; }
        public string? ContentType { get; set; } // "news" or "shared_article"

        // Properties
        public int Id { get => id; set => id = value; }
        public int NewsId { get => newsId; set => newsId = value; }
        public int UserId { get => userId; set => userId = value; }
        public string? Reason { get => reason; set => reason = value; }
        public DateTime ReportedAt { get => reportedAt; set => reportedAt = value; }
        public bool IsResolved { get => isResolved; set => isResolved = value; }

        // Extended properties
        public string? ReporterUsername { get; set; }
        public string? ContentTitle { get; set; }

        // Constructors
        public Report() { }

        public Report(int id, int newsId, int userId, string? reason, DateTime reportedAt, bool isResolved)
        {
            Id = id;
            NewsId = newsId;
            UserId = userId;
            Reason = reason;
            ReportedAt = reportedAt;
            IsResolved = isResolved;
        }

        // Static Methods
        public static bool ReportContent(int userId, string contentType, int contentId, string reason)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.ReportContent(userId, contentType, contentId, reason);
        }

        public static List<Report> GetReports(bool? resolved = null)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.GetReports(resolved);
        }

        public static bool ResolveReport(int reportId, bool resolved)
        {
            CommunityDBservices db = new CommunityDBservices();
            return db.ResolveReport(reportId, resolved);
        }
    }
}