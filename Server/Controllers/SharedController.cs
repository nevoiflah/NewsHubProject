using Microsoft.AspNetCore.Mvc;
using Server.BL;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SharedController : ControllerBase
    {
        [HttpPost]
        public IActionResult ShareArticle([FromBody] ShareArticleRequest request, [FromQuery] int userId)
        {
            try
            {
                // Create SharedArticle object from request
                var shared = new SharedArticle
                {
                    UserId = userId,
                    Url = request.Url,
                    ArticleTitle = request.ArticleTitle,
                    ArticleDescription = request.ArticleDescription,
                    ArticleSource = request.ArticleSource,
                    ArticleImageUrl = request.ArticleImageUrl,
                    Comment = request.Comment,
                    Tags = request.Tags != null ? string.Join(",", request.Tags) : null,
                    CreatedAt = DateTime.UtcNow,
                    IsFlagged = false,
                    Likes = 0,
                    CommentsCount = 0
                };

                int id = SharedArticle.CreateSharedArticle(shared, userId);
                if (id > 0)
                {
                    shared.Id = id;

                    // Trigger Share Notification to Followers
                    // "Get notified when people you follow share articles"
                    Task.Run(async () => 
                    {
                        Console.WriteLine($"[DEBUG] Attempting Share Notification task. Sharer: {userId}");
                        try 
                        {
                            // 1. Get the sharer's username
                            var sharer = Users.GetUserById(userId);
                            if (sharer != null) 
                            {
                                // 2. Get all users following this sharer
                                var followers = UserFollow.GetFollowers(userId);
                                
                                // 3. Send notification to each follower
                                foreach (var follower in followers)
                                {
                                    await NotificationService.SendShareNotification(follower.Id, sharer.Username, request.ArticleTitle ?? "Shared Article");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                           Console.WriteLine($"Error sending share notifications: {ex.Message}");
                        }
                    });

                    return Ok(new { success = true, sharedId = id, message = "Article shared successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to share article" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetAll([FromQuery] int? userId = null)
        {
            try
            {
                var list = SharedArticle.GetSharedArticles(userId);
                
                // Return in format expected by frontend
                return Ok(new 
                { 
                    success = true, 
                    articles = list,
                    count = list.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id, [FromQuery] int? userId = null)
        {
            try
            {
                var item = SharedArticle.GetSharedArticleById(id, userId);
                if (item != null)
                {
                    return Ok(new { success = true, article = item });
                }
                return NotFound(new { success = false, message = "Shared article not found" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id, [FromQuery] int userId)
        {
            try
            {
                bool deleted = SharedArticle.DeleteSharedArticle(id, userId);
                return deleted
                    ? Ok(new { success = true, message = "Shared article deleted successfully" })
                    : BadRequest(new { success = false, message = "Failed to delete shared article" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        // Like/Unlike endpoints
        [HttpPost("{articleId}/like")]
        [HttpDelete("{articleId}/like")]
        public IActionResult LikeArticle(int articleId, [FromQuery] int userId)
        {
            try
            {
                if (userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                // The procedure handles both like and unlike logic
                bool success = SharedArticle.LikeSharedArticle(articleId, userId);
                
                if (success)
                {
                    // Fire-and-forget notification
                    _ = Task.Run(async () => 
                    {
                        try
                        {
                            var article = SharedArticle.GetSharedArticleById(articleId, userId);
                            var liker = Users.GetUserById(userId);
                            
                            Console.WriteLine($"[DEBUG] Notification Check: ArticleID={articleId}, LikerID={userId}, ArticleOwnerID={article?.UserId}");

                            if (article != null && liker != null && article.UserId != userId)
                            {
                                Console.WriteLine($"[DEBUG] Sending notification to Owner {article.UserId} from Liker {liker.Username}");
                                await NotificationService.SendLikeNotification(article.UserId, liker.Id, liker.Username, article.ArticleTitle ?? "Shared Article");
                            }
                            else
                            {
                                Console.WriteLine($"[DEBUG] Skip Notification: ArticleNull={article==null}, LikerNull={liker==null}, SelfLike={article?.UserId == userId}");
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error triggering like notification: {ex.Message}");
                        }
                    });

                    return Ok(new { success = true, message = "Like added successfully" });
                }
                else
                {
                    return Ok(new { success = true, message = "Like removed successfully" });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error processing like request" });
            }
        }

        // Comments endpoints
        [HttpGet("{articleId}/comments")]
        public IActionResult GetComments(int articleId, [FromQuery] int? userId = null)
        {
            try
            {
                // This would need to be implemented in your SharedArticleComment class
                var comments = SharedArticleComment.GetCommentsByArticleId(articleId, userId);
                return Ok(new 
                { 
                    success = true, 
                    comments = comments,
                    count = comments.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost("{articleId}/comments")]
        public IActionResult AddComment(int articleId, [FromBody] AddCommentRequest request, [FromQuery] int userId)
        {
            try
            {
                var comment = new SharedArticleComment
                {
                    SharedArticleId = articleId,
                    UserId = userId,
                    Content = request.Content,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                int commentId = SharedArticleComment.CreateComment(comment);
                if (commentId > 0)
                {
                     // Trigger Comment Notification to Article Owner
                    Task.Run(async () => 
                    {
                        Console.WriteLine($"[DEBUG] Attempting Comment Notification task. ArticleId: {articleId}");
                        try 
                        {
                            var article = SharedArticle.GetSharedArticleById(articleId, userId);
                            if (article != null && article.UserId != userId) // Don't notify if commenting on own post
                            {
                                var commenter = Users.GetUserById(userId);
                                if (commenter != null)
                                {
                                    await NotificationService.SendCommentNotification(article.UserId, userId, commenter.Username, article.ArticleTitle ?? "Shared Article");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"Error sending comment notification: {ex.Message}");
                        }
                    });

                    return Ok(new { success = true, commentId = commentId, message = "Comment added successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to add comment" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpDelete("{articleId}/comments/{commentId}")]
        public IActionResult DeleteComment(int articleId, int commentId, [FromQuery] int userId)
        {
            try
            {
                bool success = SharedArticleComment.DeleteComment(commentId, userId);
                return success 
                    ? Ok(new { success = true, message = "Comment deleted successfully" })
                    : BadRequest(new { success = false, message = "Failed to delete comment" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }
    }

    // Request models
    public class ShareArticleRequest
    {
        public string Url { get; set; } = "";
        public string? ArticleTitle { get; set; }
        public string? ArticleDescription { get; set; }
        public string? ArticleSource { get; set; }
        public string? ArticleImageUrl { get; set; }
        public string? Comment { get; set; }
        public List<string>? Tags { get; set; }
    }

    public class AddCommentRequest
    {
        public string Content { get; set; } = "";
    }
}