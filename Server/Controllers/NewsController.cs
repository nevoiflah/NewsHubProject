using Microsoft.AspNetCore.Mvc;
using Server.BL;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewsController : ControllerBase
    {
        [HttpPost("save")]
        public IActionResult SaveNews([FromBody] SaveNewsRequest request, [FromQuery] int userId)
        {
            try
            {
                Console.WriteLine($"🔍 SaveNews called - UserId: {userId}, Title: {request.Title}");

                // Validate required parameters
                if (userId <= 0)
                {
                    Console.WriteLine("❌ Invalid userId");
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                if (string.IsNullOrEmpty(request.Title) && string.IsNullOrEmpty(request.Url))
                {
                    Console.WriteLine("❌ Missing required fields");
                    return BadRequest(new { success = false, message = "Title or URL is required" });
                }

                var article = new News
                {
                    Title = request.Title ?? "",
                    Content = request.Content ?? "",
                    Url = request.Url ?? "",
                    UrlToImage = request.UrlToImage,
                    PublishedAt = request.PublishedAt ?? DateTime.UtcNow,
                    Source = request.Source ?? "",
                    Author = request.Author ?? "",
                    Category = request.Category ?? "general",
                    Sentiment = request.Sentiment ?? "",
                    Country = request.Country ?? ""
                };

                int newsId = News.SaveNews(article, userId);
                Console.WriteLine($"✅ Article saved successfully - NewsId: {newsId}");

                if (newsId > 0)
                {
                    return Ok(new 
                    { 
                        success = true,
                        newsId = newsId,
                        message = "Article saved successfully",
                        userId = userId
                    });
                }
                else
                {
                    Console.WriteLine("❌ Save failed - returned invalid ID");
                    return BadRequest(new { success = false, message = "Failed to save article" });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 SaveNews error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("saved")]
        public IActionResult GetSavedNewsForUser([FromQuery] int userId)
        {
            try
            {
                Console.WriteLine($"🔍 GetSavedNewsForUser called - UserId: {userId}");

                // Validate userId
                if (userId <= 0)
                {
                    Console.WriteLine("❌ Invalid userId");
                    return BadRequest(new { success = false, message = "Invalid user ID" });
                }

                var savedArticles = News.GetSavedNews(userId);
                Console.WriteLine($"📰 Found {savedArticles?.Count ?? 0} saved articles for user {userId}");

                if (savedArticles == null)
                {
                    savedArticles = new List<News>();
                }

                return Ok(new
                {
                    success = true,
                    articles = savedArticles,
                    message = $"Found {savedArticles.Count} saved articles",
                    count = savedArticles.Count,
                    userId = userId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 GetSavedNewsForUser error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new
                {
                    success = false,
                    error = "Database failure",
                    message = ex.Message,
                    userId = userId
                });
            }
        }

        [HttpGet("saved/{newsId}")]
        public IActionResult GetSavedNewsById(int newsId, [FromQuery] int userId)
        {
            try
            {
                Console.WriteLine($"🔍 GetSavedNewsById called - NewsId: {newsId}, UserId: {userId}");

                if (newsId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid parameters" });
                }

                var article = News.GetSavedNewsById(newsId, userId);
                
                if (article == null)
                {
                    Console.WriteLine($"❌ Article not found - NewsId: {newsId}, UserId: {userId}");
                    return NotFound(new { success = false, message = "Article not found" });
                }

                Console.WriteLine($"✅ Article found - NewsId: {newsId}");
                return Ok(new 
                { 
                    success = true, 
                    article = article,
                    message = "Article retrieved successfully" 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 GetSavedNewsById error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpDelete("saved/{newsId}")]
        public IActionResult UnsaveNewsForUser(int newsId, [FromQuery] int userId)
        {
            try
            {
                Console.WriteLine($"🔍 UnsaveNewsForUser called - NewsId: {newsId}, UserId: {userId}");

                if (newsId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid parameters" });
                }

                bool result = News.UnsaveForUser(userId, newsId);
                Console.WriteLine($"🗑️ Unsave result: {result}");

                return result
                    ? Ok(new { success = true, message = "Article removed from saved list" })
                    : BadRequest(new { success = false, message = "Failed to remove article or article not found" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 UnsaveNewsForUser error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        // Check if an article is saved by a user
        [HttpGet("saved/{newsId}/status")]
        public IActionResult CheckIfSaved(int newsId, [FromQuery] int userId)
        {
            try
            {
                if (newsId <= 0 || userId <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid parameters" });
                }

                var article = News.GetSavedNewsById(newsId, userId);
                bool isSaved = article != null;

                return Ok(new 
                { 
                    success = true, 
                    isSaved = isSaved,
                    newsId = newsId,
                    userId = userId
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 CheckIfSaved error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        // Get all news (for the main news feed)
        [HttpGet("latest")]
        public IActionResult GetLatestNews([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            try
            {
                Console.WriteLine($"🔍 GetLatestNews called - Page: {page}, PageSize: {pageSize}");

                // This should return actual news articles from your news source
                // For now, returning empty list - you might want to implement actual news fetching
                var articles = new List<News>();

                return Ok(new
                {
                    success = true,
                    articles = articles,
                    count = articles.Count,
                    page = page,
                    pageSize = pageSize,
                    message = "Latest news retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 GetLatestNews error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetNewsById(int id)
        {
            try
            {
                Console.WriteLine($"🔍 GetNewsById called - Id: {id}");

                if (id <= 0)
                {
                    return BadRequest(new { success = false, message = "Invalid news ID" });
                }

                // This should get a news article by ID from your news database
                // You might need to implement this based on your specific needs
                return NotFound(new { success = false, message = "News article not found" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 GetNewsById error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        // Debug endpoint to check database state
        [HttpGet("debug/user/{userId}")]
        public IActionResult DebugUserSaves(int userId)
        {
            try
            {
                Console.WriteLine($"🔍 Debug endpoint called for user: {userId}");

                var savedArticles = News.GetSavedNews(userId);
                
                return Ok(new
                {
                    success = true,
                    userId = userId,
                    savedCount = savedArticles?.Count ?? 0,
                    articles = savedArticles,
                    timestamp = DateTime.UtcNow,
                    message = "Debug info retrieved"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"💥 Debug error: {ex.Message}");
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }
    }

    // DTO for the save request
    public class SaveNewsRequest
    {
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? Url { get; set; }
        public string? UrlToImage { get; set; }
        public DateTime? PublishedAt { get; set; }
        public string? Source { get; set; }
        public string? Author { get; set; }
        public string? Category { get; set; }
        public string? Sentiment { get; set; }
        public string? Country { get; set; }
    }
}