-- Create FCM Tokens table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NLM_NewsHub_FCMTokens' AND xtype='U')
BEGIN
    CREATE TABLE NLM_NewsHub_FCMTokens (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        UserId INT NOT NULL,
        Token NVARCHAR(500) NOT NULL,
        DeviceType NVARCHAR(50) DEFAULT 'web',
        UserAgent NVARCHAR(500) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        LastUsedAt DATETIME2 DEFAULT GETDATE(),
        IsActive BIT DEFAULT 1,
        FOREIGN KEY (UserId) REFERENCES NLM_NewsHub_Users(Id) ON DELETE CASCADE
    );
    
    -- Create indexes
    CREATE INDEX IX_FCMTokens_UserId ON NLM_NewsHub_FCMTokens(UserId);
    CREATE INDEX IX_FCMTokens_Token ON NLM_NewsHub_FCMTokens(Token);
    CREATE INDEX IX_FCMTokens_Active ON NLM_NewsHub_FCMTokens(IsActive);
    
    PRINT 'FCM Tokens table created successfully';
END
ELSE
BEGIN
    PRINT 'FCM Tokens table already exists';
END
GO
