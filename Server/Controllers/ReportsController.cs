using Microsoft.AspNetCore.Mvc;
using Server.BL;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        [HttpPost]
        public IActionResult CreateReport([FromBody] CreateReportRequest request, [FromQuery] int userId)
        {
            try
            {
                if (string.IsNullOrEmpty(request.Reason?.Trim()))
                {
                    return BadRequest(new { success = false, message = "Reason is required" });
                }

                if (string.IsNullOrEmpty(request.ContentType) || request.ContentId <= 0)
                {
                    return BadRequest(new { success = false, message = "Valid content type and ID are required" });
                }

                // Validate content type
                var validContentTypes = new[] { "news", "shared_article", "comment" };
                if (!validContentTypes.Contains(request.ContentType.ToLower()))
                {
                    return BadRequest(new { success = false, message = "Invalid content type" });
                }

                bool success = Report.ReportContent(userId, request.ContentType.ToLower(), request.ContentId, request.Reason.Trim());
                
                if (success)
                {
                    return Ok(new { success = true, message = "Report submitted successfully" });
                }
                
                return StatusCode(500, new { success = false, message = "Failed to submit report" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet]
        public IActionResult GetReports([FromQuery] bool? resolved = null, [FromQuery] int? adminUserId = null)
        {
            try
            {
                // Check if user is admin (you might want to implement proper admin check)
                if (adminUserId.HasValue)
                {
                    // Add admin verification logic here if needed
                }

                var reports = Report.GetReports(resolved);
                
                return Ok(new
                {
                    success = true,
                    reports = reports,
                    count = reports.Count
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public IActionResult GetReportById(int id)
        {
            try
            {
                var reports = Report.GetReports(null);
                var report = reports.FirstOrDefault(r => r.Id == id);
                
                if (report == null)
                {
                    return NotFound(new { success = false, message = "Report not found" });
                }
                
                return Ok(new { success = true, report = report });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPut("{id}/resolve")]
        public IActionResult ResolveReport(int id, [FromBody] ResolveReportRequest request, [FromQuery] int adminUserId)
        {
            try
            {
                // Add admin verification logic here if needed

                bool success = Report.ResolveReport(id, request.IsResolved);
                
                if (success)
                {
                    string message = request.IsResolved ? "Report marked as resolved" : "Report marked as unresolved";
                    return Ok(new { success = true, message = message });
                }
                
                return BadRequest(new { success = false, message = "Failed to update report status" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("statistics")]
        public IActionResult GetReportStatistics([FromQuery] int? adminUserId = null)
        {
            try
            {
                // Add admin verification logic here if needed

                var allReports = Report.GetReports(null);
                var resolvedReports = allReports.Where(r => r.IsResolved).Count();
                var pendingReports = allReports.Where(r => !r.IsResolved).Count();

                // Group by content type
                var byContentType = allReports
                    .GroupBy(r => r.ContentType ?? "unknown")
                    .ToDictionary(g => g.Key, g => g.Count());

                // Group by reason (basic categorization)
                var byReason = allReports
                    .GroupBy(r => CategorizeReason(r.Reason))
                    .ToDictionary(g => g.Key, g => g.Count());

                return Ok(new
                {
                    success = true,
                    statistics = new
                    {
                        total = allReports.Count,
                        resolved = resolvedReports,
                        pending = pendingReports,
                        byContentType = byContentType,
                        byReason = byReason
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        private string CategorizeReason(string? reason)
        {
            if (string.IsNullOrEmpty(reason)) return "No reason";

            reason = reason.ToLower();

            if (reason.Contains("offensive") || reason.Contains("inappropriate") || reason.Contains("harassment"))
                return "Offensive content";
            if (reason.Contains("false") || reason.Contains("misinformation") || reason.Contains("fake"))
                return "False information";
            if (reason.Contains("spam"))
                return "Spam";
            if (reason.Contains("copyright") || reason.Contains("plagiarism"))
                return "Copyright";
            
            return "Other";
        }
    }

    // DTOs for requests
    public class CreateReportRequest
    {
        public string ContentType { get; set; } = ""; // "news", "shared_article", "comment"
        public int ContentId { get; set; }
        public string Reason { get; set; } = "";
    }

    public class ResolveReportRequest
    {
        public bool IsResolved { get; set; }
    }
}