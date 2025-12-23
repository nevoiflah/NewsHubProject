-- Remove IsLocked column and related logic from NewsHub Database

-- 1. Remove IsLocked column from Users table
-- Check if column-- 1. Remove the IsLocked column from NLM_NewsHub_Users
IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'IsLocked' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
BEGIN
    -- Drop the default constraint first if it exists
    DECLARE @ConstraintName nvarchar(200)
    SELECT @ConstraintName = Name FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'NLM_NewsHub_Users')
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE NAME = N'IsLocked' AND object_id = OBJECT_ID(N'NLM_NewsHub_Users'))

    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE NLM_NewsHub_Users DROP CONSTRAINT ' + @ConstraintName)
    END

    -- Now drop the column
    ALTER TABLE NLM_NewsHub_Users DROP COLUMN IsLocked;
END
GO

-- 2. Drop the LockUser Stored Procedure
IF OBJECT_ID('NLM_NewsHub_LockUser', 'P') IS NOT NULL
DROP PROCEDURE NLM_NewsHub_LockUser;
GO

-- 3. Update User Insertion Procedure (Remove IsLocked parameter)
-- Assumes IsLocked was a parameter. Re-creating the logic without it.
CREATE OR ALTER PROCEDURE NLM_NewsHub_InsertUser
    @Username NVARCHAR(50),
    @Email NVARCHAR(100),
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @PasswordHash NVARCHAR(255),
    @AvatarUrl NVARCHAR(255) = NULL,
    @NotifyOnLikes BIT = 1,
    @NotifyOnComments BIT = 1,
    @NotifyOnFollow BIT = 1,
    @NotifyOnShare BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO NLM_NewsHub_Users (Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare)
    VALUES (@Username, @Email, @FirstName, @LastName, @PasswordHash, GETDATE(), 0, @AvatarUrl, 0, 0, @NotifyOnLikes, @NotifyOnComments, @NotifyOnFollow, @NotifyOnShare);
    
    SELECT SCOPE_IDENTITY() AS UserId;
END
GO

-- 4. Update User Retrieval Procedures
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    WHERE Id = @Id;
END
GO

CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserByUsername
    @Username NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    WHERE Username = @Username;
END
GO

CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserByEmail
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    WHERE Email = @Email;
END
GO

-- 5. Update Get All Users 
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users 
    ORDER BY RegistrationDate DESC;
END
GO

-- 6. Update UpdateUser (Remove IsLocked if it was there, usually it isn't but just in case)
CREATE OR ALTER PROCEDURE NLM_NewsHub_UpdateUser
    @Id INT,
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100), -- Usually email updates might be separate or here
    @AvatarUrl NVARCHAR(255) = NULL,
    @NotifyOnLikes BIT,
    @NotifyOnComments BIT,
    @NotifyOnFollow BIT,
    @NotifyOnShare BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE NLM_NewsHub_Users
    SET FirstName = @FirstName,
        LastName = @LastName,
        Email = @Email,
        AvatarUrl = @AvatarUrl,
        NotifyOnLikes = @NotifyOnLikes,
        NotifyOnComments = @NotifyOnComments,
        NotifyOnFollow = @NotifyOnFollow,
        NotifyOnShare = @NotifyOnShare
    WHERE Id = @Id;
    
    -- Return updated user
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    WHERE Id = @Id;
END
GO

-- 7. Update GetSystemStats Procedure
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetSystemStats
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        (SELECT COUNT(*) FROM NLM_NewsHub_Users) as TotalUsers,
        (SELECT COUNT(*) FROM NLM_NewsHub_Users WHERE LastLoginDate >= DATEADD(day, -30, GETDATE())) as ActiveUsers,
        (SELECT COUNT(*) FROM NLM_NewsHub_SharedArticles) as SharedArticles,
        (SELECT COUNT(*) FROM NLM_NewsHub_Reports WHERE IsResolved = 0) as PendingReports;
END
GO

-- 8. Backfill LastLoginDate so Active Users stats are visible immediately
UPDATE NLM_NewsHub_Users
SET LastLoginDate = GETDATE()
WHERE LastLoginDate IS NULL;
GO
