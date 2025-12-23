-- Final Fix for 500 Internal Server Error during User Deletion
-- IMPLEMENTS FULL CASCADING DELETE
-- This script handles all known tables: Follows, Blocks, Likes, Comments, Reports, Saved Articles, Shared Articles, Preferences, Tokens.

CREATE OR ALTER PROCEDURE NLM_NewsHub_DeleteUser
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. FCM Tokens & Preferences
        DELETE FROM NLM_NewsHub_FCMTokens WHERE UserId = @Id;
        DELETE FROM NLM_NewsHub_UserPreferences WHERE UserId = @Id;

        -- 2. User Follows (As Follower OR Followed)
        -- Using columns from CommunityDBservices: FollowerUserId / FollowedUserId
        DELETE FROM NLM_NewsHub_UserFollows WHERE FollowerUserId = @Id OR FollowedUserId = @Id;

        -- 3. User Blocks (As Blocker OR Blocked)
        -- Using columns from CommunityDBservices: BlockerUserId / BlockedUserId
        DELETE FROM NLM_NewsHub_UserBlocks WHERE BlockerUserId = @Id OR BlockedUserId = @Id;

        -- 4. Shared Article LIKES (The user's likes)
        DELETE FROM NLM_NewsHub_SharedArticleLikes WHERE UserId = @Id;

        -- 5. Shared Article COMMENTS (The user's comments)
        DELETE FROM NLM_NewsHub_SharedArticleComments WHERE UserId = @Id;

        -- 6. Reports created by the user
        DELETE FROM NLM_NewsHub_Reports WHERE UserId = @Id;

        -- 7. CLEANUP LINKED TO USER'S SHARED ARTICLES
        --    When deleting a user, we delete their Shared Articles.
        --    BUT first we must delete other people's interactions with those articles.
        
        --    A) Comments on user's shared articles
        DELETE FROM NLM_NewsHub_SharedArticleComments 
        WHERE SharedArticleId IN (SELECT Id FROM NLM_NewsHub_SharedArticles WHERE UserId = @Id);

        --    B) Likes on user's shared articles
        DELETE FROM NLM_NewsHub_SharedArticleLikes 
        WHERE SharedArticleId IN (SELECT Id FROM NLM_NewsHub_SharedArticles WHERE UserId = @Id);

        --    C) Reports on user's shared articles (Reason prefixed with 'SharedArticle:')
        DELETE FROM NLM_NewsHub_Reports 
        WHERE Reason LIKE 'SharedArticle:%' 
          AND NewsId IN (SELECT Id FROM NLM_NewsHub_SharedArticles WHERE UserId = @Id);

        --    D) Now safe to delete the Shared Articles
        DELETE FROM NLM_NewsHub_SharedArticles WHERE UserId = @Id;

        -- 8. CLEANUP LINKED TO USER'S SAVED NEWS
        --    A) Reports on "proper" news saved by the user (rare but possible)
        --       (Standard reports use NewsId linking to ArticlesSaved)
        DELETE FROM NLM_NewsHub_Reports 
        WHERE Reason NOT LIKE 'SharedArticle:%' 
          AND NewsId IN (SELECT Id FROM NLM_NewsHub_ArticlesSaved WHERE UserId = @Id);

        --    B) Delete the Saved Articles
        DELETE FROM NLM_NewsHub_ArticlesSaved WHERE UserId = @Id;

        -- 9. Finally, Delete the User
        -- Turn NOCOUNT OFF so ExecuteNonQuery returns the count of deleted users (should be 1)
        SET NOCOUNT OFF;
        DELETE FROM NLM_NewsHub_Users WHERE Id = @Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO
