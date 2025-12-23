-- Fix for Orphaned Data (Shared Articles Deletion)
-- Ensures that when a Shared Article is deleted, all its interactions are removed too.

CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_DeleteSharedArticle]
    @Id INT,
    @UserId INT
AS
BEGIN
    SET NOCOUNT OFF;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Verify Ownership (or allow if you want admin override, but current logic enforces owner)
        --    The original SP enforced: WHERE Id = @Id AND UserId = @UserId
        --    We need to check existence first to safely run multiple deletes
        IF NOT EXISTS (SELECT 1 FROM [dbo].[NLM_NewsHub_SharedArticles] WHERE Id = @Id AND UserId = @UserId)
        BEGIN
            -- Not found or not owner, do nothing (or could raise error)
            COMMIT TRANSACTION;
            SELECT 0 AS RowsAffected;
            RETURN;
        END

        -- 2. Delete Comments on this article
        DELETE FROM [dbo].[NLM_NewsHub_SharedArticleComments] WHERE SharedArticleId = @Id;

        -- 3. Delete Likes on this article
        DELETE FROM [dbo].[NLM_NewsHub_SharedArticleLikes] WHERE SharedArticleId = @Id;

        -- 4. Delete Reports on this article
        --    Recall Reports distinguish shared articles via Reason prefix or referencing NewsId
        --    Using logic from our DeleteUserFix:
        DELETE FROM [dbo].[NLM_NewsHub_Reports] 
        WHERE Reason LIKE 'SharedArticle:%' 
          AND NewsId = @Id;

        -- 5. Delete the Shared Article itself
        DELETE FROM [dbo].[NLM_NewsHub_SharedArticles] 
        WHERE Id = @Id AND UserId = @UserId;

        COMMIT TRANSACTION;
        
        -- Return 1 to indicate success (since verification passed)
        SELECT 1 AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT 0 AS RowsAffected;
    END CATCH
END
GO
