-- User Following Relationships Table
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NLM_NewsHub_UserFollows](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[FollowerUserId] [int] NOT NULL,
	[FollowedUserId] [int] NOT NULL,
	[FollowedAt] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[FollowerUserId] ASC,
	[FollowedUserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserFollows] ADD DEFAULT (getutcdate()) FOR [FollowedAt]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserFollows] WITH CHECK ADD CONSTRAINT [FK_UserFollows_Follower] FOREIGN KEY([FollowerUserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserFollows] CHECK CONSTRAINT [FK_UserFollows_Follower]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserFollows] WITH CHECK ADD CONSTRAINT [FK_UserFollows_Followed] FOREIGN KEY([FollowedUserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserFollows] CHECK CONSTRAINT [FK_UserFollows_Followed]
GO

-- User Blocking Relationships Table
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NLM_NewsHub_UserBlocks](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[BlockerUserId] [int] NOT NULL,
	[BlockedUserId] [int] NOT NULL,
	[BlockedAt] [datetime] NOT NULL,
	[Reason] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[BlockerUserId] ASC,
	[BlockedUserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserBlocks] ADD DEFAULT (getutcdate()) FOR [BlockedAt]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserBlocks] WITH CHECK ADD CONSTRAINT [FK_UserBlocks_Blocker] FOREIGN KEY([BlockerUserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserBlocks] CHECK CONSTRAINT [FK_UserBlocks_Blocker]
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserBlocks] WITH CHECK ADD CONSTRAINT [FK_UserBlocks_Blocked] FOREIGN KEY([BlockedUserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_UserBlocks] CHECK CONSTRAINT [FK_UserBlocks_Blocked]
GO

-- Comments on Shared Articles Table
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NLM_NewsHub_SharedArticleComments](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SharedArticleId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[Content] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime] NOT NULL,
	[IsDeleted] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] ADD DEFAULT (getutcdate()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] ADD DEFAULT ((0)) FOR [IsDeleted]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] WITH CHECK ADD CONSTRAINT [FK_Comments_SharedArticle] FOREIGN KEY([SharedArticleId])
REFERENCES [dbo].[NLM_NewsHub_SharedArticles] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] CHECK CONSTRAINT [FK_Comments_SharedArticle]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] WITH CHECK ADD CONSTRAINT [FK_Comments_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleComments] CHECK CONSTRAINT [FK_Comments_User]
GO

-- Likes on Shared Articles Table
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[NLM_NewsHub_SharedArticleLikes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SharedArticleId] [int] NOT NULL,
	[UserId] [int] NOT NULL,
	[LikedAt] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[SharedArticleId] ASC,
	[UserId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleLikes] ADD DEFAULT (getutcdate()) FOR [LikedAt]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleLikes] WITH CHECK ADD CONSTRAINT [FK_Likes_SharedArticle] FOREIGN KEY([SharedArticleId])
REFERENCES [dbo].[NLM_NewsHub_SharedArticles] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleLikes] CHECK CONSTRAINT [FK_Likes_SharedArticle]
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleLikes] WITH CHECK ADD CONSTRAINT [FK_Likes_User] FOREIGN KEY([UserId])
REFERENCES [dbo].[NLM_NewsHub_Users] ([Id])
GO
ALTER TABLE [dbo].[NLM_NewsHub_SharedArticleLikes] CHECK CONSTRAINT [FK_Likes_User]
GO
-- Add IsDeleted column to NLM_NewsHub_SharedArticleLikes table
ALTER TABLE NLM_NewsHub_SharedArticleLikes 
ADD IsDeleted BIT DEFAULT 0;