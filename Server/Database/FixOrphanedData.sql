-- Fix for Orphaned Data (Shared Articles Deletion)
-- Ensures that when a Shared Article is deleted, all its interactions are removed too.

CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_DeleteSharedArticle]
    @Id INT,
    @UserId INT,
    @IsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT OFF;
    
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Verify Ownership OR Admin Status
        IF @IsAdmin = 0 AND NOT EXISTS (SELECT 1 FROM [dbo].[NLM_NewsHub_SharedArticles] WHERE Id = @Id AND UserId = @UserId)
        BEGIN
            -- Not found or not owner, and not admin -> Fail
            COMMIT TRANSACTION;
            SELECT 0 AS RowsAffected;
            RETURN;
        END

        -- 2. Delete Comments on this article
        DELETE FROM [dbo].[NLM_NewsHub_SharedArticleComments] WHERE SharedArticleId = @Id;

        -- 3. Delete Likes on this article
        DELETE FROM [dbo].[NLM_NewsHub_SharedArticleLikes] WHERE SharedArticleId = @Id;

        -- 4. Delete Reports on this article
        DELETE FROM [dbo].[NLM_NewsHub_Reports] 
        WHERE Reason LIKE 'SharedArticle:%' 
          AND NewsId = @Id;

        -- 5. Delete the Shared Article itself
        -- If Admin, delete by ID only. If User, delete by ID + UserId.
        IF @IsAdmin = 1
        BEGIN
            DELETE FROM [dbo].[NLM_NewsHub_SharedArticles] WHERE Id = @Id;
        END
        else
        BEGIN
            DELETE FROM [dbo].[NLM_NewsHub_SharedArticles] WHERE Id = @Id AND UserId = @UserId;
        END

        COMMIT TRANSACTION;
        
        -- Return 1 to indicate success
        SELECT 1 AS RowsAffected;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT 0 AS RowsAffected;
    END CATCH
END
GO
