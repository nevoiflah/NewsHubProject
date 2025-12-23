-- Fix for Community Features (Reports & Blocked Users)
-- Resolves API 500/400 errors by aligning SPs with DAL expectations

-- 1. Fix ResolveReport to work with ExecuteNonQuery
--    DAL uses ExecuteNonQuery, so we must SET NOCOUNT OFF and rely on the row count message,
--    NOT a SELECT statement.
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_ResolveReport]
    @ReportId INT,
    @IsResolved BIT
AS
BEGIN
    -- Turn NOCOUNT OFF so ExecuteNonQuery receives the "rows affected" count
    SET NOCOUNT OFF;
    
    UPDATE [dbo].[NLM_NewsHub_Reports] 
    SET IsResolved = @IsResolved 
    WHERE Id = @ReportId;
    
    -- No SELECT needed
END
GO

-- 2. Ensure GetBlockedUsers exists and returns correct columns
--    DAL expects: Id, BlockerUserId, BlockedUserId, BlockedAt, Reason, BlockedUsername
CREATE OR ALTER PROCEDURE [dbo].[NLM_NewsHub_GetBlockedUsers]
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.Id,
        b.BlockerUserId,
        b.BlockedUserId,
        b.BlockedAt,
        b.Reason,
        u.Username AS BlockedUsername
    FROM [dbo].[NLM_NewsHub_UserBlocks] b
    INNER JOIN [dbo].[NLM_NewsHub_Users] u ON b.BlockedUserId = u.Id
    WHERE b.BlockerUserId = @UserId
    ORDER BY b.BlockedAt DESC;
END
GO
