-- FinalSchemaFix.sql
-- This script reconciles all database schema and stored procedure mismatches
-- and fully removes the 'IsLocked' feature remnants.

-- 1. ENSURE COLUMNS EXIST IN NLM_NewsHub_Users
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'NotifyOnLikes' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD NotifyOnLikes BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'NotifyOnComments' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD NotifyOnComments BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'NotifyOnFollow' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD NotifyOnFollow BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'NotifyOnShare' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD NotifyOnShare BIT DEFAULT 1;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'ActivityLevel' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD ActivityLevel INT DEFAULT 0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'LikesReceived' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
    ALTER TABLE NLM_NewsHub_Users ADD LikesReceived INT DEFAULT 0;

-- 2. REMOVE IsLocked COLUMN IF IT EXISTS
IF EXISTS (SELECT * FROM sys.columns WHERE Name = N'IsLocked' AND Object_ID = Object_ID(N'NLM_NewsHub_Users'))
BEGIN
    DECLARE @ConstraintName nvarchar(200)
    SELECT @ConstraintName = Name FROM sys.default_constraints
    WHERE parent_object_id = OBJECT_ID(N'NLM_NewsHub_Users')
    AND parent_column_id = (SELECT column_id FROM sys.columns WHERE NAME = N'IsLocked' AND object_id = OBJECT_ID(N'NLM_NewsHub_Users'))

    IF @ConstraintName IS NOT NULL
        EXEC('ALTER TABLE NLM_NewsHub_Users DROP CONSTRAINT ' + @ConstraintName)

    ALTER TABLE NLM_NewsHub_Users DROP COLUMN IsLocked;
END
GO

-- 3. SET DEFAULT VALUES FOR EXISTING USERS TO AVOID NULL ERRORS
UPDATE NLM_NewsHub_Users SET NotifyOnLikes = 1 WHERE NotifyOnLikes IS NULL;
UPDATE NLM_NewsHub_Users SET NotifyOnComments = 1 WHERE NotifyOnComments IS NULL;
UPDATE NLM_NewsHub_Users SET NotifyOnFollow = 1 WHERE NotifyOnFollow IS NULL;
UPDATE NLM_NewsHub_Users SET NotifyOnShare = 1 WHERE NotifyOnShare IS NULL;
UPDATE NLM_NewsHub_Users SET ActivityLevel = 0 WHERE ActivityLevel IS NULL;
UPDATE NLM_NewsHub_Users SET LikesReceived = 0 WHERE LikesReceived IS NULL;
GO

-- 4. RE-CREATE ALL USER STORED PROCEDURES (SYNCED WITH C# DAL)

-- Get User By ID
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

-- Get User By Username
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

-- Get User By Email
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

-- Get All Users
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, LastLoginDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users 
    ORDER BY RegistrationDate DESC;
END
GO

-- Insert User
CREATE OR ALTER PROCEDURE NLM_NewsHub_InsertUser
    @Username NVARCHAR(50),
    @Email NVARCHAR(100),
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @PasswordHash NVARCHAR(500),
    @AvatarUrl NVARCHAR(255) = NULL,
    @RegistrationDate DATETIME2 = NULL,
    @IsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO NLM_NewsHub_Users (Username, Email, FirstName, LastName, PasswordHash, RegistrationDate, IsAdmin, AvatarUrl, ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare)
    VALUES (@Username, @Email, @FirstName, @LastName, @PasswordHash, ISNULL(@RegistrationDate, GETDATE()), @IsAdmin, @AvatarUrl, 0, 0, 1, 1, 1, 1);
    SELECT SCOPE_IDENTITY() AS UserId;
END
GO

-- Update User (Synced with C# paramDic)
CREATE OR ALTER PROCEDURE NLM_NewsHub_UpdateUser
    @Id INT,
    @Username NVARCHAR(50) = NULL,
    @Email NVARCHAR(100) = NULL,
    @FirstName NVARCHAR(50) = NULL,
    @LastName NVARCHAR(50) = NULL,
    @PasswordHash NVARCHAR(500) = NULL,
    @NotifyOnLikes BIT = 1,
    @NotifyOnComments BIT = 1,
    @NotifyOnFollow BIT = 1,
    @NotifyOnShare BIT = 1,
    @AvatarUrl NVARCHAR(255) = NULL -- Optional extension
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE NLM_NewsHub_Users
    SET Username = ISNULL(@Username, Username),
        Email = ISNULL(@Email, Email),
        FirstName = ISNULL(@FirstName, FirstName),
        LastName = ISNULL(@LastName, LastName),
        PasswordHash = ISNULL(@PasswordHash, PasswordHash),
        NotifyOnLikes = ISNULL(@NotifyOnLikes, NotifyOnLikes),
        NotifyOnComments = ISNULL(@NotifyOnComments, NotifyOnComments),
        NotifyOnFollow = ISNULL(@NotifyOnFollow, NotifyOnFollow),
        NotifyOnShare = ISNULL(@NotifyOnShare, NotifyOnShare),
        AvatarUrl = ISNULL(@AvatarUrl, AvatarUrl)
    WHERE Id = @Id;
END
GO

-- Get System Stats (Ensure it matches Admin.cs expectations)
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
