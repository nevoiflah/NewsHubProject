-- ================================================
-- SQL STORED PROCEDURES FOR USERS FUNCTIONALITY
-- WITH NLM_NEWSHUB TABLE PREFIXES
-- ================================================

-- ================================================
-- CREATE TABLES AND ADD MISSING COLUMNS
-- ================================================

-- Create NLM_NewsHub_UserPreferences table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_UserPreferences' AND xtype='U')
CREATE TABLE NLM_NewsHub_UserPreferences (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Category NVARCHAR(50) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (UserId) REFERENCES NLM_NewsHub_Users(Id)
);
GO

-- Create NLM_NewsHub_FCMTokens table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_FCMTokens' AND xtype='U')
CREATE TABLE NLM_NewsHub_FCMTokens (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    Token NVARCHAR(500) NOT NULL,
    DeviceType NVARCHAR(50) DEFAULT 'web',
    UserAgent NVARCHAR(500) NULL,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    LastUsedAt DATETIME2 DEFAULT GETDATE(),
    IsActive BIT DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES NLM_NewsHub_Users(Id)
);
GO

-- Add missing columns to FCMTokens if they don't exist
IF EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_FCMTokens' AND xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_FCMTokens') AND name = 'DeviceType')
        ALTER TABLE NLM_NewsHub_FCMTokens ADD DeviceType NVARCHAR(50) DEFAULT 'web';
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_FCMTokens') AND name = 'UserAgent')
        ALTER TABLE NLM_NewsHub_FCMTokens ADD UserAgent NVARCHAR(500) NULL;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_FCMTokens') AND name = 'CreatedAt')
        ALTER TABLE NLM_NewsHub_FCMTokens ADD CreatedAt DATETIME2 DEFAULT GETDATE();
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_FCMTokens') AND name = 'LastUsedAt')
        ALTER TABLE NLM_NewsHub_FCMTokens ADD LastUsedAt DATETIME2 DEFAULT GETDATE();
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_FCMTokens') AND name = 'IsActive')
        ALTER TABLE NLM_NewsHub_FCMTokens ADD IsActive BIT DEFAULT 1;
END
GO

-- Create NLM_NewsHub_UserFollows table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_UserFollows' AND xtype='U')
CREATE TABLE NLM_NewsHub_UserFollows (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    FollowerId INT NOT NULL,
    FollowingId INT NOT NULL,
    FollowedAt DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (FollowerId) REFERENCES NLM_NewsHub_Users(Id),
    FOREIGN KEY (FollowingId) REFERENCES NLM_NewsHub_Users(Id),
    UNIQUE(FollowerId, FollowingId)
);
GO

-- Create NLM_NewsHub_BlockedUsers table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_BlockedUsers' AND xtype='U')
CREATE TABLE NLM_NewsHub_BlockedUsers (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NOT NULL,
    BlockedUserId INT NOT NULL,
    BlockedAt DATETIME2 DEFAULT GETDATE(),
    Reason NVARCHAR(255),
    FOREIGN KEY (UserId) REFERENCES NLM_NewsHub_Users(Id),
    FOREIGN KEY (BlockedUserId) REFERENCES NLM_NewsHub_Users(Id),
    UNIQUE(UserId, BlockedUserId)
);
GO

-- Add missing columns to BlockedUsers if they don't exist
IF EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_BlockedUsers' AND xtype='U')
BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_BlockedUsers') AND name = 'UserId')
        ALTER TABLE NLM_NewsHub_BlockedUsers ADD UserId INT;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_BlockedUsers') AND name = 'BlockedUserId')
        ALTER TABLE NLM_NewsHub_BlockedUsers ADD BlockedUserId INT;
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_BlockedUsers') AND name = 'BlockedAt')
        ALTER TABLE NLM_NewsHub_BlockedUsers ADD BlockedAt DATETIME2 DEFAULT GETDATE();
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NLM_NewsHub_BlockedUsers') AND name = 'Reason')
        ALTER TABLE NLM_NewsHub_BlockedUsers ADD Reason NVARCHAR(255);
END
GO

-- ================================================
-- USER PREFERENCE STORED PROCEDURES
-- ================================================

-- Get User Preference
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserPreference
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 Category 
    FROM NLM_NewsHub_UserPreferences 
    WHERE UserId = @UserId 
    ORDER BY UpdatedAt DESC;
END
GO

-- Save User Preference
CREATE OR ALTER PROCEDURE NLM_NewsHub_SaveUserPreference
    @UserId INT,
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if preference exists
    IF EXISTS (SELECT 1 FROM NLM_NewsHub_UserPreferences WHERE UserId = @UserId)
    BEGIN
        -- Update existing preference
        UPDATE NLM_NewsHub_UserPreferences 
        SET Category = @Category, UpdatedAt = GETDATE()
        WHERE UserId = @UserId;
    END
    ELSE
    BEGIN
        -- Insert new preference
        INSERT INTO NLM_NewsHub_UserPreferences (UserId, Category)
        VALUES (@UserId, @Category);
    END
END
GO

-- ================================================
-- FOLLOWING SYSTEM STORED PROCEDURES
-- ================================================

-- Get User Following List
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserFollowingList
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FollowingId
    FROM NLM_NewsHub_UserFollows
    WHERE FollowerId = @UserId;
END
GO

-- Get User Followers List
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserFollowersList
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FollowerId
    FROM NLM_NewsHub_UserFollows
    WHERE FollowingId = @UserId;
END
GO

-- Follow User
CREATE OR ALTER PROCEDURE NLM_NewsHub_FollowUser
    @FollowerId INT,
    @FolloweeId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if already following
    IF NOT EXISTS (SELECT 1 FROM NLM_NewsHub_UserFollows WHERE FollowerId = @FollowerId AND FollowingId = @FolloweeId)
    BEGIN
        INSERT INTO NLM_NewsHub_UserFollows (FollowerId, FollowingId)
        VALUES (@FollowerId, @FolloweeId);
    END
END
GO

-- Unfollow User
CREATE OR ALTER PROCEDURE NLM_NewsHub_UnfollowUser
    @FollowerId INT,
    @FolloweeId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM NLM_NewsHub_UserFollows 
    WHERE FollowerId = @FollowerId AND FollowingId = @FolloweeId;
END
GO

-- Check if Following
CREATE OR ALTER PROCEDURE NLM_NewsHub_IsFollowing
    @FollowerId INT,
    @FolloweeId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM NLM_NewsHub_UserFollows WHERE FollowerId = @FollowerId AND FollowingId = @FolloweeId)
        SELECT CAST(1 AS BIT) AS IsFollowing;
    ELSE
        SELECT CAST(0 AS BIT) AS IsFollowing;
END
GO

-- Get Followers Count
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetFollowersCount
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS FollowersCount
    FROM NLM_NewsHub_UserFollows
    WHERE FollowingId = @UserId;
END
GO

-- Get Following Count
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetFollowingCount
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) AS FollowingCount
    FROM NLM_NewsHub_UserFollows
    WHERE FollowerId = @UserId;
END
GO

-- ================================================
-- FCM TOKEN MANAGEMENT STORED PROCEDURES
-- ================================================

-- Store FCM Token
CREATE OR ALTER PROCEDURE NLM_NewsHub_StoreFCMToken
    @UserId INT,
    @Token NVARCHAR(500),
    @DeviceType NVARCHAR(50) = 'web',
    @UserAgent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Deactivate existing tokens for this user and device type
    UPDATE NLM_NewsHub_FCMTokens 
    SET IsActive = 0 
    WHERE UserId = @UserId AND DeviceType = @DeviceType;
    
    -- Insert new token or update if exists
    IF EXISTS (SELECT 1 FROM NLM_NewsHub_FCMTokens WHERE Token = @Token)
    BEGIN
        UPDATE NLM_NewsHub_FCMTokens 
        SET UserId = @UserId, 
            DeviceType = @DeviceType,
            UserAgent = @UserAgent,
            LastUsedAt = GETDATE(),
            IsActive = 1
        WHERE Token = @Token;
    END
    ELSE
    BEGIN
        INSERT INTO NLM_NewsHub_FCMTokens (UserId, Token, DeviceType, UserAgent)
        VALUES (@UserId, @Token, @DeviceType, @UserAgent);
    END
END
GO

-- Get User FCM Tokens
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserFCMTokens
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Token
    FROM NLM_NewsHub_FCMTokens
    WHERE UserId = @UserId 
      AND IsActive = 1
      AND LastUsedAt > DATEADD(DAY, -30, GETDATE());
END
GO

-- Deactivate FCM Token
CREATE OR ALTER PROCEDURE NLM_NewsHub_DeactivateFCMToken
    @Token NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_FCMTokens 
    SET IsActive = 0 
    WHERE Token = @Token;
END
GO

-- Cleanup Expired Tokens
CREATE OR ALTER PROCEDURE NLM_NewsHub_CleanupExpiredTokens
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Deactivate tokens older than 60 days
    UPDATE NLM_NewsHub_FCMTokens 
    SET IsActive = 0 
    WHERE UserId = @UserId 
      AND LastUsedAt < DATEADD(DAY, -60, GETDATE());
      
    -- Delete very old tokens (older than 90 days)
    DELETE FROM NLM_NewsHub_FCMTokens 
    WHERE UserId = @UserId 
      AND LastUsedAt < DATEADD(DAY, -90, GETDATE());
END
GO

-- ================================================
-- UPDATE EXISTING USER PROCEDURES
-- ================================================

-- Enhanced Update User to include notification preferences
CREATE OR ALTER PROCEDURE NLM_NewsHub_UpdateUser
    @Id INT,
    @Username NVARCHAR(50),
    @Email NVARCHAR(100),
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @PasswordHash NVARCHAR(500),
    @NotifyOnLikes BIT = 1,
    @NotifyOnComments BIT = 1,
    @NotifyOnFollow BIT = 1,
    @NotifyOnShare BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_Users 
    SET Username = @Username,
        Email = @Email,
        FirstName = @FirstName,
        LastName = @LastName,
        PasswordHash = @PasswordHash,
        NotifyOnLikes = @NotifyOnLikes,
        NotifyOnComments = @NotifyOnComments,
        NotifyOnFollow = @NotifyOnFollow,
        NotifyOnShare = @NotifyOnShare
    WHERE Id = @Id;
END
GO

-- ================================================
-- ENSURE ALL EXISTING PROCEDURES EXIST
-- ================================================

-- Get All Users
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetAllUsers
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, 
           RegistrationDate, LastLoginDate, IsLocked, IsAdmin, AvatarUrl,
           ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments,
           NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    ORDER BY RegistrationDate DESC;
END
GO

-- Get User By ID
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetUserById
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, 
           RegistrationDate, LastLoginDate, IsLocked, IsAdmin, AvatarUrl,
           ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments,
           NotifyOnFollow, NotifyOnShare
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
    
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, 
           RegistrationDate, LastLoginDate, IsLocked, IsAdmin, AvatarUrl,
           ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments,
           NotifyOnFollow, NotifyOnShare
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
    
    SELECT Id, Username, Email, FirstName, LastName, PasswordHash, 
           RegistrationDate, LastLoginDate, IsLocked, IsAdmin, AvatarUrl,
           ActivityLevel, LikesReceived, NotifyOnLikes, NotifyOnComments,
           NotifyOnFollow, NotifyOnShare
    FROM NLM_NewsHub_Users
    WHERE Email = @Email;
END
GO

-- Register User
CREATE OR ALTER PROCEDURE NLM_NewsHub_RegisterUser
    @Username NVARCHAR(50),
    @Email NVARCHAR(100),
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @PasswordHash NVARCHAR(500),
    @RegistrationDate DATETIME2,
    @AvatarUrl NVARCHAR(255) = '',
    @IsAdmin BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO NLM_NewsHub_Users (Username, Email, FirstName, LastName, PasswordHash, 
                      RegistrationDate, AvatarUrl, IsAdmin, ActivityLevel, LikesReceived,
                      NotifyOnLikes, NotifyOnComments, NotifyOnFollow, NotifyOnShare)
    VALUES (@Username, @Email, @FirstName, @LastName, @PasswordHash, 
            @RegistrationDate, @AvatarUrl, @IsAdmin, 0, 0, 1, 1, 1, 1);
    
    SELECT SCOPE_IDENTITY();
END
GO

-- Delete User
CREATE OR ALTER PROCEDURE NLM_NewsHub_DeleteUser
    @Id INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Clean up related data first
    DELETE FROM NLM_NewsHub_FCMTokens WHERE UserId = @Id;
    DELETE FROM NLM_NewsHub_UserPreferences WHERE UserId = @Id;
    DELETE FROM NLM_NewsHub_UserFollows WHERE FollowerId = @Id OR FollowingId = @Id;
    DELETE FROM NLM_NewsHub_BlockedUsers WHERE UserId = @Id OR BlockedUserId = @Id;
    
    -- Delete the user
    DELETE FROM NLM_NewsHub_Users WHERE Id = @Id;
END
GO

-- Lock User
CREATE OR ALTER PROCEDURE NLM_NewsHub_LockUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_Users SET IsLocked = 1 WHERE Id = @UserId;
END
GO

-- Unlock User
CREATE OR ALTER PROCEDURE NLM_NewsHub_UnlockUser
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_Users SET IsLocked = 0 WHERE Id = @UserId;
END
GO

-- Update Last Login
CREATE OR ALTER PROCEDURE NLM_NewsHub_UpdateLastLogin
    @UserId INT,
    @LoginTime DATETIME2
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_Users SET LastLoginDate = @LoginTime WHERE Id = @UserId;
END
GO

-- Log User Login (placeholder for analytics)
CREATE OR ALTER PROCEDURE NLM_NewsHub_LogUserLogin
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update last login
    UPDATE NLM_NewsHub_Users SET LastLoginDate = GETDATE() WHERE Id = @UserId;
END
GO

-- Block User
CREATE OR ALTER PROCEDURE NLM_NewsHub_BlockUser
    @UserId INT,
    @BlockedUserId INT,
    @Reason NVARCHAR(255) = ''
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Insert block record if not exists
    IF NOT EXISTS (SELECT 1 FROM NLM_NewsHub_BlockedUsers WHERE UserId = @UserId AND BlockedUserId = @BlockedUserId)
    BEGIN
        INSERT INTO NLM_NewsHub_BlockedUsers (UserId, BlockedUserId, Reason)
        VALUES (@UserId, @BlockedUserId, @Reason);
    END
END
GO

-- Unblock User
CREATE OR ALTER PROCEDURE NLM_NewsHub_UnblockUser
    @UserId INT,
    @BlockedUserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM NLM_NewsHub_BlockedUsers 
    WHERE UserId = @UserId AND BlockedUserId = @BlockedUserId;
END
GO

-- Get Blocked Users
CREATE OR ALTER PROCEDURE NLM_NewsHub_GetBlockedUsers
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT u.Id, u.Username, u.Email, u.FirstName, u.LastName, u.PasswordHash, 
           u.RegistrationDate, u.LastLoginDate, u.IsLocked, u.IsAdmin, u.AvatarUrl,
           u.ActivityLevel, u.LikesReceived, u.NotifyOnLikes, u.NotifyOnComments,
           u.NotifyOnFollow, u.NotifyOnShare, bu.BlockedUserId
    FROM NLM_NewsHub_BlockedUsers bu
    INNER JOIN NLM_NewsHub_Users u ON bu.BlockedUserId = u.Id
    WHERE bu.UserId = @UserId;
END
GO

-- Update User Activity
CREATE OR ALTER PROCEDURE NLM_NewsHub_UpdateUserActivity
    @UserId INT,
    @Points INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE NLM_NewsHub_Users 
    SET ActivityLevel = ActivityLevel + @Points
    WHERE Id = @UserId;
END
GO

-- ================================================
-- VERIFICATION QUERY
-- ================================================
-- Run this to verify all procedures were created
SELECT name, type_desc, create_date, modify_date
FROM sys.procedures 
WHERE name LIKE 'NLM_NewsHub_%'
ORDER BY name;

-- Run this to verify all tables were created
SELECT name, create_date, modify_date
FROM sys.tables 
WHERE name LIKE 'NLM_NewsHub_%'
ORDER BY name;