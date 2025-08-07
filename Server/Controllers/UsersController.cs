using Microsoft.AspNetCore.Mvc;
using Server.BL;
using System.Data.SqlClient;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
       [HttpPost("Register")]
        public IActionResult Post([FromBody] Users user)
        {
            try
            {
                int result = Users.Register(user);
                if (result > 0)
                    return Ok(new { success = true, message = "User registered successfully.", userId = result });
                else if (result == -1)
                    return Conflict(new { success = false, message = "Username already exists." });
                else if (result == -2)
                    return Conflict(new { success = false, message = "Email already exists." });
                else
                    return BadRequest(new { success = false, message = "Failed to register user." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost("Login")]
        public IActionResult Login([FromBody] UserLogin request)
        {
            try
            {
                Users? user = Users.Login(request.Username, request.Password);
                if (user != null)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Login successful.",
                        user = new
                        {
                            id = user.Id,
                            username = user.Username,
                            email = user.Email,
                            firstName = user.FirstName,
                            lastName = user.LastName,
                            registrationDate = user.RegistrationDate,
                            lastLoginDate = user.LastLoginDate,
                            isLocked = user.IsLocked,
                            isAdmin = user.IsAdmin,
                            avatarUrl = user.AvatarUrl,
                            activityLevel = user.ActivityLevel,
                            likesReceived = user.LikesReceived,
                            notifyOnLikes = user.NotifyOnLikes,
                            notifyOnComments = user.NotifyOnComments,
                            notifyOnFollow = user.NotifyOnFollow,
                            notifyOnShare = user.NotifyOnShare
                        }
                    });
                }
                else
                {
                    return Unauthorized("Invalid username or password.");
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            try
            {
                int result = Users.DeleteUser(id);
                if (result == 1)
                    return Ok("User deleted successfully.");
                return NotFound("User not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        /// <summary>
        /// Updates user profile information with password confirmation.
        /// Allows partial updates - only the fields provided will be updated.
        /// Requires current password for any changes.
        /// If changing password, the current password must be provided as confirmation.
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="request">Update request containing fields to update and current password</param>
        /// <returns>Success or error response</returns>
        [HttpPut("Update/{id}")]
        public IActionResult UpdateProfile([FromRoute] int id, [FromBody] UserUpdateRequest request)
        {
            try
            {
                // Get the current user to verify password and get existing data
                var currentUser = Users.GetUserById(id);
                if (currentUser == null)
                {
                    return NotFound(new { success = false, message = "User not found." });
                }

                // Verify current password for any changes
                if (!currentUser.VerifyPassword(request.CurrentPassword))
                {
                    return BadRequest(new { success = false, message = "Current password is incorrect." });
                }

                // If trying to change password, verify old password
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    if (!currentUser.VerifyPassword(request.CurrentPassword))
                    {
                        return BadRequest(new { success = false, message = "Current password is incorrect for password change." });
                    }
                }

                // Validate email and username uniqueness if they're being changed
                string newEmail = !string.IsNullOrEmpty(request.Email) ? request.Email : currentUser.Email;
                string newUsername = !string.IsNullOrEmpty(request.Username) ? request.Username : currentUser.Username;
                
                int validationResult = Users.ValidateUserUpdate(id, newEmail, newUsername);
                if (validationResult == -1)
                {
                    return BadRequest(new { success = false, message = "Username already exists." });
                }
                else if (validationResult == -2)
                {
                    return BadRequest(new { success = false, message = "Email already exists." });
                }
                else if (validationResult == 0)
                {
                    return BadRequest(new { success = false, message = "Validation error occurred." });
                }

                // Create updated user object with partial updates
                // Handle password properly - only hash if we're changing it
                string passwordToUse = currentUser.PasswordHash; // Keep existing hash by default
                if (!string.IsNullOrEmpty(request.NewPassword))
                {
                    // Create a temporary user to hash the new password
                    var tempUser = new Users(0, "", "", "", "", request.NewPassword, DateTime.Now, null, false, false, "", 0, 0, true, true, true, true);
                    passwordToUse = tempUser.HashPassword(request.NewPassword);
                }
                
                var updatedUser = new Users(
                    currentUser.Id,
                    newUsername,
                    newEmail,
                    !string.IsNullOrEmpty(request.FirstName) ? request.FirstName : currentUser.FirstName,
                    !string.IsNullOrEmpty(request.LastName) ? request.LastName : currentUser.LastName,
                    passwordToUse,
                    currentUser.RegistrationDate,
                    currentUser.LastLoginDate,
                    currentUser.IsLocked,
                    currentUser.IsAdmin,
                    !string.IsNullOrEmpty(request.AvatarUrl) ? request.AvatarUrl : currentUser.AvatarUrl,
                    currentUser.ActivityLevel,
                    currentUser.LikesReceived,
                    request.NotifyOnLikes.HasValue ? request.NotifyOnLikes.Value : currentUser.NotifyOnLikes,
                    request.NotifyOnComments.HasValue ? request.NotifyOnComments.Value : currentUser.NotifyOnComments,
                    request.NotifyOnFollow.HasValue ? request.NotifyOnFollow.Value : currentUser.NotifyOnFollow,
                    request.NotifyOnShare.HasValue ? request.NotifyOnShare.Value : currentUser.NotifyOnShare
                );

                if (Users.Update(id, updatedUser))
                {
                    return Ok(new { success = true, message = "User updated successfully." });
                }
                else
                {
                    return BadRequest(new { success = false, message = "Failed to update user." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "An error occurred while updating the user: " + ex.Message });
            }
        }

        [HttpPost("verify-password")]
        public IActionResult VerifyPassword([FromBody] PasswordVerificationRequest request)
        {
            try
            {
                var user = Users.GetUserById(request.UserId);
                if (user == null)
                {
                    return NotFound("User not found.");
                }

                bool isValid = user.VerifyPassword(request.Password);
                return Ok(new { success = isValid });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error verifying password: " + ex.Message });
            }
        }

        [HttpGet("GetById/{id}")]
        public IActionResult GetById(int id)
        {
            try
            {
                var user = Users.GetUserById(id);
                if (user != null)
                    return Ok(user);
                else
                    return NotFound();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("GetAllUsers")]
        public IActionResult GetAllUsers()
        {
            try
            {
                var users = Users.GetAllUsers();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpPost("SetLock/{userId}")]
        public IActionResult SetLock(int userId, [FromQuery] bool isLocked)
        {
            try
            {
                int result = Users.SetUserLock(userId, isLocked);
                if (result == 1)
                    return Ok($"User {(isLocked ? "locked" : "unlocked")} successfully.");
                return NotFound("User not found.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error: " + ex.Message);
            }
        }

        [HttpGet("interests/{userId}")]
        public IActionResult GetUserInterests(int userId)
        {
            try
            {
                var interests = Users.GetUserInterests(userId);
                return Ok(interests ?? new List<string>());
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in GetUserInterests: " + ex.Message);
                return Ok(new List<string>());
            }
        }

        [HttpPost("interests")]
        public IActionResult SaveUserInterests([FromBody] InterestsRequest request)
        {
            try
            {
                bool success = Users.SaveUserInterests(request.UserId, request.Categories);
                return success ? Ok(new { success = true }) : BadRequest("Failed to save interests.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in SaveUserInterests: " + ex.Message);
                return BadRequest("Error saving interests: " + ex.Message);
            }
        }

        [HttpDelete("interests/{userId}")]
        public IActionResult ClearUserInterests(int userId)
        {
            try
            {
                bool success = Users.ClearUserInterests(userId);
                return success ? Ok(new { success = true }) : BadRequest("Failed to clear interests.");
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in ClearUserInterests: " + ex.Message);
                return BadRequest("Error clearing interests: " + ex.Message);
            }
        }

        /// <summary>
        /// Updates notification preferences without password confirmation (for convenience)
        /// </summary>
        /// <param name="request">Notification preferences request</param>
        /// <returns>Success or error response</returns>
        [HttpPut("notification-preferences")]
        public IActionResult UpdateNotificationPreferences([FromBody] NotificationPreferencesRequest request)
        {
            try
            {
                bool success = Users.UpdateNotificationPreferences(request.UserId, request.NotifyOnLikes, 
                    request.NotifyOnComments, request.NotifyOnFollow, request.NotifyOnShare);
                return success ? Ok(new { success = true, message = "Notification preferences updated successfully." }) : BadRequest(new { success = false, message = "Failed to update notification preferences." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in UpdateNotificationPreferences: " + ex.Message);
                return BadRequest(new { success = false, message = "Error updating notification preferences: " + ex.Message });
            }
        }

        /// <summary>
        /// Updates notification preferences with password confirmation for security
        /// </summary>
        /// <param name="request">Secure notification preferences request with password</param>
        /// <returns>Success or error response</returns>
        [HttpPut("notification-preferences-secure")]
        public IActionResult UpdateNotificationPreferencesSecure([FromBody] NotificationPreferencesSecureRequest request)
        {
            try
            {
                // Get the current user to verify password
                var currentUser = Users.GetUserById(request.UserId);
                if (currentUser == null)
                {
                    return NotFound(new { success = false, message = "User not found." });
                }

                // Verify current password
                if (!currentUser.VerifyPassword(request.CurrentPassword))
                {
                    return BadRequest(new { success = false, message = "Current password is incorrect." });
                }

                bool success = Users.UpdateNotificationPreferences(request.UserId, request.NotifyOnLikes, 
                    request.NotifyOnComments, request.NotifyOnFollow, request.NotifyOnShare);
                return success ? Ok(new { success = true, message = "Notification preferences updated successfully." }) : BadRequest(new { success = false, message = "Failed to update notification preferences." });
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in UpdateNotificationPreferencesSecure: " + ex.Message);
                return BadRequest(new { success = false, message = "Error updating notification preferences: " + ex.Message });
            }
        }

        [HttpPost("activity/{userId}")]
        public IActionResult UpdateUserActivity(int userId)
        {
            try
            {
                int newActivityLevel = Users.UpdateUserActivity(userId, 2);
                return Ok(new { success = true, activityLevel = newActivityLevel });
            }
            catch (Exception ex)
            {
                Console.WriteLine("⚠️ Error in UpdateUserActivity: " + ex.Message);
                return BadRequest("Error updating user activity: " + ex.Message);
            }
        }

        // ======================================
        // MISSING ENDPOINTS - COMMUNITY FEATURES
        // ======================================

        [HttpGet("blocked")]
        public IActionResult GetBlockedUsers([FromQuery] int userId)
        {
            try
            {
                var blockedUsers = UserBlock.GetBlockedUsers(userId);
                return Ok(new
                {
                    success = true,
                    blockedUsers = blockedUsers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("following")]
        public IActionResult GetFollowingUsers([FromQuery] int userId)
        {
            try
            {
                var following = UserFollow.GetFollowing(userId);
                return Ok(new
                {
                    success = true,
                    following = following
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("following-stats")]
        public IActionResult GetFollowingStats([FromQuery] int userId)
        {
            try
            {
                var stats = UserFollow.GetFollowStats(userId);
                return Ok(new
                {
                    success = true,
                    stats = stats
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost("{targetUserId}/follow")]
        public IActionResult FollowUser(int targetUserId, [FromQuery] int userId)
        {
            try
            {
                bool success = UserFollow.FollowUser(userId, targetUserId);
                if (success)
                {
                    return Ok(new { success = true, message = "User followed successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to follow user" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpDelete("{targetUserId}/follow")]
        public IActionResult UnfollowUser(int targetUserId, [FromQuery] int userId)
        {
            try
            {
                bool success = UserFollow.UnfollowUser(userId, targetUserId);
                if (success)
                {
                    return Ok(new { success = true, message = "User unfollowed successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to unfollow user" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpPost("{targetUserId}/block")]
        public IActionResult BlockUser(int targetUserId, [FromQuery] int userId, [FromBody] BlockUserRequest? request = null)
        {
            try
            {
                string? reason = request?.Reason;
                bool success = UserBlock.BlockUser(userId, targetUserId, reason);
                if (success)
                {
                    return Ok(new { success = true, message = "User blocked successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to block user" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpDelete("{targetUserId}/block")]
        public IActionResult UnblockUser(int targetUserId, [FromQuery] int userId)
        {
            try
            {
                bool success = UserBlock.UnblockUser(userId, targetUserId);
                if (success)
                {
                    return Ok(new { success = true, message = "User unblocked successfully" });
                }
                return BadRequest(new { success = false, message = "Failed to unblock user" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{targetUserId}/is-following")]
        public IActionResult IsFollowing(int targetUserId, [FromQuery] int userId)
        {
            try
            {
                bool isFollowing = UserFollow.IsFollowing(userId, targetUserId);
                return Ok(new { success = true, isFollowing = isFollowing });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{targetUserId}/is-blocked")]
        public IActionResult IsBlocked(int targetUserId, [FromQuery] int userId)
        {
            try
            {
                bool isBlocked = UserBlock.IsBlocked(userId, targetUserId);
                return Ok(new { success = true, isBlocked = isBlocked });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        [HttpGet("{userId}/followers")]
        public IActionResult GetFollowers(int userId)
        {
            try
            {
                var followers = UserFollow.GetFollowers(userId);
                return Ok(new
                {
                    success = true,
                    followers = followers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Error: " + ex.Message });
            }
        }

        
    }

    // ======================================
    // REQUEST MODELS
    // ======================================

    public class UserLogin
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class InterestsRequest
    {
        public int UserId { get; set; }
        public List<string> Categories { get; set; } = new List<string>();
    }

    public class BlockUserRequest
    {
        public string? Reason { get; set; }
    }

    public class NotificationPreferencesRequest
    {
        public int UserId { get; set; }
        public bool NotifyOnLikes { get; set; }
        public bool NotifyOnComments { get; set; }
        public bool NotifyOnFollow { get; set; }
        public bool NotifyOnShare { get; set; }
    }

    public class NotificationPreferencesSecureRequest
    {
        public int UserId { get; set; }
        public string CurrentPassword { get; set; } = string.Empty;
        public bool NotifyOnLikes { get; set; }
        public bool NotifyOnComments { get; set; }
        public bool NotifyOnFollow { get; set; }
        public bool NotifyOnShare { get; set; }
    }

    public class UserUpdateRequest
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? NewPassword { get; set; }
        public string? AvatarUrl { get; set; }
        public bool? NotifyOnLikes { get; set; }
        public bool? NotifyOnComments { get; set; }
        public bool? NotifyOnFollow { get; set; }
        public bool? NotifyOnShare { get; set; }
    }

    public class PasswordVerificationRequest
    {
        public int UserId { get; set; }
        public string Password { get; set; } = string.Empty;
    }
}