-- ==================== SHARED ARTICLES PROCEDURES ====================

-- Create Shared Article
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_CreateSharedArticle]
    @UserId INT,
    @Url NVARCHAR(MAX),
    @ArticleTitle NVARCHAR(500) = NULL,
    @ArticleDescription NVARCHAR(MAX) = NULL,
    @ArticleSource NVARCHAR(255) = NULL,
    @ArticleImageUrl NVARCHAR(1000) = NULL,
    @Comment NVARCHAR(MAX) = NULL,
    @Tags NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO [dbo].[NLM_NewsHub_SharedArticles] 
    (UserId, Url, ArticleTitle, ArticleDescription, ArticleSource, ArticleImageUrl, Comment, Tags)
    VALUES 
    (@UserId, @Url, @ArticleTitle, @ArticleDescription, @ArticleSource, @ArticleImageUrl, @Comment, @Tags);
    
    SELECT SCOPE_IDENTITY() AS NewId;
END
GO

-- Get Shared Articles with dynamic like count and block filtering
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_GetSharedArticles]
    @UserId INT = NULL,
    @SortBy NVARCHAR(50) = 'newest',
    @Page INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @PageSize;
    
    SELECT 
        sa.Id,
        sa.UserId,
        sa.Url,
        sa.ArticleTitle,
        sa.ArticleDescription,
        sa.ArticleSource,
        sa.ArticleImageUrl,
        sa.Comment,
        sa.Tags,
        sa.CreatedAt,
        sa.IsFlagged,
        sa.CommentsCount,
        u.Username,
        u.ActivityLevel,
        -- Calculate likes dynamically from the likes table
        (SELECT COUNT(*) FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
         WHERE SharedArticleId = sa.Id AND IsDeleted = 0) AS Likes,
        -- Check if current user liked this article
        CASE 
            WHEN @UserId IS NOT NULL AND EXISTS (
                SELECT 1 FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
                WHERE SharedArticleId = sa.Id AND UserId = @UserId AND IsDeleted = 0
            ) THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS IsLikedByCurrentUser
    FROM [dbo].[NLM_NewsHub_SharedArticles] sa
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON sa.UserId = u.Id
    WHERE sa.IsFlagged = 0
      -- Exclude content from blocked users (if @UserId is provided)
      AND (@UserId IS NULL OR NOT EXISTS (
          SELECT 1 FROM [dbo].[NLM_NewsHub_UserBlocks] 
          WHERE BlockerUserId = @UserId AND BlockedUserId = sa.UserId
      ))
      -- Exclude content from users who blocked the current user (if @UserId is provided)
      AND (@UserId IS NULL OR NOT EXISTS (
          SELECT 1 FROM [dbo].[NLM_NewsHub_UserBlocks] 
          WHERE BlockerUserId = sa.UserId AND BlockedUserId = @UserId
      ))
    ORDER BY 
        CASE WHEN @SortBy = 'newest' THEN sa.CreatedAt END DESC,
        CASE WHEN @SortBy = 'oldest' THEN sa.CreatedAt END ASC,
        CASE WHEN @SortBy = 'most_comments' THEN sa.CommentsCount END DESC,
        CASE WHEN @SortBy = 'most_liked' THEN (
            SELECT COUNT(*) FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
            WHERE SharedArticleId = sa.Id AND IsDeleted = 0
        ) END DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
END
GO

-- Get Shared Article By ID with dynamic like count and block filtering
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_GetSharedArticleById]
    @Id INT,
    @CurrentUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sa.Id,
        sa.UserId,
        sa.Url,
        sa.ArticleTitle,
        sa.ArticleDescription,
        sa.ArticleSource,
        sa.ArticleImageUrl,
        sa.Comment,
        sa.Tags,
        sa.CreatedAt,
        sa.IsFlagged,
        sa.CommentsCount,
        u.Username,
        u.ActivityLevel,
        -- Calculate likes dynamically from the likes table
        (SELECT COUNT(*) FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
         WHERE SharedArticleId = sa.Id AND IsDeleted = 0) AS Likes,
        -- Check if current user liked this article
        CASE 
            WHEN @CurrentUserId IS NOT NULL AND EXISTS (
                SELECT 1 FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
                WHERE SharedArticleId = sa.Id AND UserId = @CurrentUserId AND IsDeleted = 0
            ) THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS IsLikedByCurrentUser
    FROM [dbo].[NLM_NewsHub_SharedArticles] sa
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON sa.UserId = u.Id
    WHERE sa.Id = @Id
      -- Exclude content from blocked users (if @CurrentUserId is provided)
      AND (@CurrentUserId IS NULL OR NOT EXISTS (
          SELECT 1 FROM [dbo].[NLM_NewsHub_UserBlocks] 
          WHERE BlockerUserId = @CurrentUserId AND BlockedUserId = sa.UserId
      ))
      -- Exclude content from users who blocked the current user (if @CurrentUserId is provided)
      AND (@CurrentUserId IS NULL OR NOT EXISTS (
          SELECT 1 FROM [dbo].[NLM_NewsHub_UserBlocks] 
          WHERE BlockerUserId = sa.UserId AND BlockedUserId = @CurrentUserId
      ));
END
GO

-- Delete Shared Article (Only by owner)
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_DeleteSharedArticle]
    @Id INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM [dbo].[NLM_NewsHub_SharedArticles] 
    WHERE Id = @Id AND UserId = @UserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Like Shared Article
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Updated stored procedure for liking shared articles (soft delete)
CREATE OR ALTER PROCEDURE NLM_NewsHub_LikeSharedArticle
    @SharedArticleId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @ExistingLikeId INT;
    
    -- Check if user already liked this article (including soft deleted)
    SELECT @ExistingLikeId = Id 
    FROM NLM_NewsHub_SharedArticleLikes 
    WHERE SharedArticleId = @SharedArticleId AND UserId = @UserId;
    
    IF @ExistingLikeId IS NULL
    BEGIN
        -- User hasn't liked this article before, add new like
        INSERT INTO NLM_NewsHub_SharedArticleLikes (SharedArticleId, UserId, LikedAt, IsDeleted)
        VALUES (@SharedArticleId, @UserId, GETDATE(), 0);
        
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        -- User has liked this article before, check if it's currently active
        DECLARE @IsCurrentlyLiked BIT;
        SELECT @IsCurrentlyLiked = IsDeleted 
        FROM NLM_NewsHub_SharedArticleLikes 
        WHERE Id = @ExistingLikeId;
        
        IF @IsCurrentlyLiked = 1
        BEGIN
            -- Like was soft deleted, reactivate it
            UPDATE NLM_NewsHub_SharedArticleLikes 
            SET IsDeleted = 0, LikedAt = GETDATE()
            WHERE Id = @ExistingLikeId;
            
            SELECT 1 AS Success;
        END
        ELSE
        BEGIN
            -- Like is currently active, soft delete it
            UPDATE NLM_NewsHub_SharedArticleLikes 
            SET IsDeleted = 1
            WHERE Id = @ExistingLikeId;
            
            SELECT 0 AS Success;
        END
    END
END
GO

-- Unlike Shared Article
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_UnlikeSharedArticle]
    @SharedArticleId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete like if exists
        IF EXISTS (SELECT 1 FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
                  WHERE SharedArticleId = @SharedArticleId AND UserId = @UserId)
        BEGIN
            DELETE FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
            WHERE SharedArticleId = @SharedArticleId AND UserId = @UserId;
            
            -- Update like count
            UPDATE [dbo].[NLM_NewsHub_SharedArticles] 
            SET Likes = Likes - 1 
            WHERE Id = @SharedArticleId AND Likes > 0;
        END
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success;
    END CATCH
END
GO

-- Check if article is liked by user (updated for soft deletes)
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_IsSharedArticleLiked]
    @SharedArticleId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS IsLiked
    FROM [dbo].[NLM_NewsHub_SharedArticleLikes] 
    WHERE SharedArticleId = @SharedArticleId 
      AND UserId = @UserId 
      AND IsDeleted = 0;
END
GO

-- Flag/Unflag Shared Article
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_FlagSharedArticle]
    @Id INT,
    @IsFlagged BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[NLM_NewsHub_SharedArticles] 
    SET IsFlagged = @IsFlagged 
    WHERE Id = @Id;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- ==================== COMMENTS PROCEDURES ====================

-- Create Comment
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_CreateComment]
    @SharedArticleId INT,
    @UserId INT,
    @Content NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert comment
        INSERT INTO [dbo].[NLM_NewsHub_SharedArticleComments] (SharedArticleId, UserId, Content)
        VALUES (@SharedArticleId, @UserId, @Content);
        
        DECLARE @CommentId INT = SCOPE_IDENTITY();
        
        -- Update comments count
        UPDATE [dbo].[NLM_NewsHub_SharedArticles] 
        SET CommentsCount = CommentsCount + 1 
        WHERE Id = @SharedArticleId;
        
        COMMIT TRANSACTION;
        SELECT @CommentId AS NewId;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT -1 AS NewId;
    END CATCH
END
GO

-- Get Comments by Article ID
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetCommentsByArticleId]
    @SharedArticleId INT,
    @CurrentUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.*,
        u.Username,
        u.IsAdmin,
        CASE 
            WHEN c.UserId = @CurrentUserId OR u.IsAdmin = 1 THEN CAST(1 AS BIT)
            ELSE CAST(0 AS BIT)
        END AS CanDelete
    FROM [dbo].[NLM_NewsHub_SharedArticleComments] c
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON c.UserId = u.Id
    WHERE c.SharedArticleId = @SharedArticleId AND c.IsDeleted = 0
    ORDER BY c.CreatedAt ASC;
END
GO

-- Delete Comment (Soft delete)
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_DeleteComment]
    @CommentId INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        DECLARE @SharedArticleId INT;
        
        -- Get article ID and verify ownership or admin
        SELECT @SharedArticleId = c.SharedArticleId
        FROM [dbo].[NLM_NewsHub_SharedArticleComments] c
        INNER JOIN [dbo].[NLM_NewsHub_Users] u ON c.UserId = u.Id
        WHERE c.Id = @CommentId 
        AND (c.UserId = @UserId OR EXISTS (SELECT 1 FROM [dbo].[NLM_NewsHub_Users] WHERE Id = @UserId AND IsAdmin = 1));
        
        IF @SharedArticleId IS NOT NULL
        BEGIN
            -- Soft delete comment
            UPDATE [dbo].[NLM_NewsHub_SharedArticleComments] 
            SET IsDeleted = 1 
            WHERE Id = @CommentId;
            
            -- Update comments count
            UPDATE [dbo].[NLM_NewsHub_SharedArticles] 
            SET CommentsCount = CommentsCount - 1 
            WHERE Id = @SharedArticleId AND CommentsCount > 0;
        END
        
        COMMIT TRANSACTION;
        SELECT @@ROWCOUNT AS RowsAffected;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS RowsAffected;
    END CATCH
END
GO

-- ==================== USER FOLLOWS PROCEDURES ====================

-- Follow User
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_FollowUser]
    @FollowerUserId INT,
    @FollowedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Prevent self-follow and duplicate follows
    IF @FollowerUserId != @FollowedUserId AND NOT EXISTS (
        SELECT 1 FROM [dbo].[NLM_NewsHub_UserFollows] 
        WHERE FollowerUserId = @FollowerUserId AND FollowedUserId = @FollowedUserId
    )
    BEGIN
        INSERT INTO [dbo].[NLM_NewsHub_UserFollows] (FollowerUserId, FollowedUserId)
        VALUES (@FollowerUserId, @FollowedUserId);
        
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        SELECT 0 AS Success;
    END
END
GO

-- Unfollow User
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_UnfollowUser]
    @FollowerUserId INT,
    @FollowedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM [dbo].[NLM_NewsHub_UserFollows] 
    WHERE FollowerUserId = @FollowerUserId AND FollowedUserId = @FollowedUserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Check if following
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_IsFollowing]
    @FollowerUserId INT,
    @FollowedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS IsFollowing
    FROM [dbo].[NLM_NewsHub_UserFollows] 
    WHERE FollowerUserId = @FollowerUserId AND FollowedUserId = @FollowedUserId;
END
GO

-- Get Following List
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetFollowing]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.*,
        u.Username AS FollowedUsername
    FROM [dbo].[NLM_NewsHub_UserFollows] f
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON f.FollowedUserId = u.Id
    WHERE f.FollowerUserId = @UserId
    ORDER BY f.FollowedAt DESC;
END
GO

-- Get Followers List
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetFollowers]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.*,
        u.Username AS FollowerUsername
    FROM [dbo].[NLM_NewsHub_UserFollows] f
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON f.FollowerUserId = u.Id
    WHERE f.FollowedUserId = @UserId
    ORDER BY f.FollowedAt DESC;
END
GO

-- Get Follow Stats
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetFollowStats]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM [dbo].[NLM_NewsHub_UserFollows] WHERE FollowerUserId = @UserId) AS FollowingCount,
        (SELECT COUNT(*) FROM [dbo].[NLM_NewsHub_UserFollows] WHERE FollowedUserId = @UserId) AS FollowersCount;
END
GO

-- ==================== USER BLOCKS PROCEDURES ====================

-- Block User
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_BlockUser]
    @BlockerUserId INT,
    @BlockedUserId INT,
    @Reason NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Check if the user to be blocked is an admin
        DECLARE @IsAdmin BIT;
        SELECT @IsAdmin = IsAdmin FROM [dbo].[NLM_NewsHub_Users] WHERE Id = @BlockedUserId;
        
        -- Prevent blocking admins
        IF @IsAdmin = 1
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Success;
            RETURN;
        END
        
        -- Prevent self-block and duplicate blocks
        IF @BlockerUserId != @BlockedUserId AND NOT EXISTS (
            SELECT 1 FROM [dbo].[NLM_NewsHub_UserBlocks] 
            WHERE BlockerUserId = @BlockerUserId AND BlockedUserId = @BlockedUserId
        )
        BEGIN
            -- Remove any existing follow relationship
            DELETE FROM [dbo].[NLM_NewsHub_UserFollows] 
            WHERE (FollowerUserId = @BlockerUserId AND FollowedUserId = @BlockedUserId)
               OR (FollowerUserId = @BlockedUserId AND FollowedUserId = @BlockerUserId);
            
            -- Insert block
            INSERT INTO [dbo].[NLM_NewsHub_UserBlocks] (BlockerUserId, BlockedUserId, Reason)
            VALUES (@BlockerUserId, @BlockedUserId, @Reason);
            
            COMMIT TRANSACTION;
            SELECT 1 AS Success;
        END
        ELSE
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS Success;
        END
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success;
    END CATCH
END
GO

-- Unblock User
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_UnblockUser]
    @BlockerUserId INT,
    @BlockedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM [dbo].[NLM_NewsHub_UserBlocks] 
    WHERE BlockerUserId = @BlockerUserId AND BlockedUserId = @BlockedUserId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Check if blocked
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_IsBlocked]
    @BlockerUserId INT,
    @BlockedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS IsBlocked
    FROM [dbo].[NLM_NewsHub_UserBlocks] 
    WHERE BlockerUserId = @BlockerUserId AND BlockedUserId = @BlockedUserId;
END
GO

-- Get Blocked Users
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetBlockedUsers]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.*,
        u.Username AS BlockedUsername
    FROM [dbo].[NLM_NewsHub_UserBlocks] b
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON b.BlockedUserId = u.Id
    WHERE b.BlockerUserId = @UserId
    ORDER BY b.BlockedAt DESC;
END
GO

-- ==================== REPORTS PROCEDURES ====================

-- Report Content
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_ReportContent]
    @UserId INT,
    @ContentType NVARCHAR(50),
    @ContentId INT,
    @Reason NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert into reports table based on content type
    IF @ContentType = 'news'
    BEGIN
        INSERT INTO [dbo].[NLM_NewsHub_Reports] (NewsId, UserId, Reason)
        VALUES (@ContentId, @UserId, @Reason);
    END
    ELSE IF @ContentType = 'shared_article'
    BEGIN
        -- For shared articles, we'll use NewsId but track it differently
        INSERT INTO [dbo].[NLM_NewsHub_Reports] (NewsId, UserId, Reason)
        VALUES (@ContentId, @UserId, 'SharedArticle: ' + @Reason);
    END
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

-- Get Reports
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_GetReports]
    @Resolved BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        r.*,
        u.Username AS ReporterUsername,
        CASE 
            WHEN r.Reason LIKE 'SharedArticle:%' THEN 'shared_article'
            ELSE 'news'
        END AS ContentType,
        CASE 
            WHEN r.Reason LIKE 'SharedArticle:%' THEN sa.ArticleTitle
            ELSE ns.Title
        END AS ContentTitle,
        CASE 
            WHEN r.Reason LIKE 'SharedArticle:%' THEN r.NewsId
            ELSE NULL
        END AS SharedArticleId
    FROM [dbo].[NLM_NewsHub_Reports] r
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON r.UserId = u.Id
    LEFT JOIN [dbo].[NLM_NewsHub_SharedArticles] sa ON r.Reason LIKE 'SharedArticle:%' AND sa.Id = r.NewsId
    LEFT JOIN [dbo].[NLM_NewsHub_ArticlesSaved] ns ON r.Reason NOT LIKE 'SharedArticle:%' AND ns.Id = r.NewsId
    WHERE (@Resolved IS NULL OR r.IsResolved = @Resolved)
    ORDER BY r.ReportedAt DESC;
END
GO

-- Resolve Report
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE PROCEDURE [dbo].[NLM_NewsHub_ResolveReport]
    @ReportId INT,
    @IsResolved BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[NLM_NewsHub_Reports] 
    SET IsResolved = @IsResolved 
    WHERE Id = @ReportId;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO