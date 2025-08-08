// interests.js - Direct $.ajax Version
function getUserIdFromStorage() {
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
        try {
            const parsed = JSON.parse(userInfo);
            return parsed.id;
        } catch (e) {
            console.warn("❌ Failed to parse userInfo from localStorage:", e);
        }
    }
    return null;
}

const InterestsManager = {
    currentInterests: [],
    availableCategories: [
        'general', 'business', 'technology', 'science', 'sports', 
        'entertainment', 'health', 'politics', 'breaking'
    ],

    // Initialize interests page
    init: function() {
        InterestsManager.setupEventListeners();
        InterestsManager.loadUserProfile();
        InterestsManager.loadUserInterests();
        InterestsManager.loadFollowingStats();
        
        // Refresh activity level every 15 seconds for more responsive updates
        setInterval(function() {
            InterestsManager.refreshActivityLevel();
        }, 15000);
        
        // Refresh likes count every 30 seconds for dynamic updates
        setInterval(function() {
            const userId = getUserIdFromStorage();
            if (userId) {
                InterestsManager.loadLikesReceivedCount(userId);
            }
        }, 30000);
    },

    // Refresh activity level from database
    refreshActivityLevel: function() {
        const userId = getUserIdFromStorage();
        if (!userId) return;

        $.ajax({
            type: 'GET',
            url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/GetById/${userId}`,
            cache: false,
            dataType: "json",
            success: function(userData) {
                const newActivityLevel = userData.activityLevel || 0;
                console.log('🔄 Refreshing activity level:', newActivityLevel);
                
                // Update interests page avatar and progress
                InterestsManager.updateUserAvatar(newActivityLevel);
                InterestsManager.updateActivityProgress(newActivityLevel);
                
                // Update all avatars using centralized system
                if (window.updateAllAvatars) {
                    window.updateAllAvatars(newActivityLevel);
                }
                
                // Update localStorage with new activity level
                const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                currentUser.activityLevel = newActivityLevel;
                localStorage.setItem('userInfo', JSON.stringify(currentUser));
            },
            error: function(xhr, status, error) {
                console.warn('Failed to refresh activity level:', error);
                // Try to update with localStorage data as fallback
                const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                if (currentUser.activityLevel !== undefined) {
                    InterestsManager.updateUserAvatar(currentUser.activityLevel);
                    InterestsManager.updateActivityProgress(currentUser.activityLevel);
                    if (window.updateAllAvatars) {
                        window.updateAllAvatars(currentUser.activityLevel);
                    }
                }
            }
        });
    },

    // Update navbar avatar after activity changes
    updateNavbarAfterActivity: function() {
        const userId = getUserIdFromStorage();
        if (!userId) return;

        // Fetch updated user data to get new activity level
        $.ajax({
            type: 'GET',
            url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/GetById/${userId}`,
            cache: false,
            dataType: "json",
            success: function(userData) {
                // Update localStorage with new activity level
                const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                currentUser.activityLevel = userData.activityLevel || 0;
                localStorage.setItem('userInfo', JSON.stringify(currentUser));
                
                // Update navbar if function exists
                if (window.updateNavbarForUser) {
                    window.updateNavbarForUser();
                }
            },
            error: function(xhr, status, error) {
                console.warn('Failed to update navbar after activity change:', error);
            }
        });
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Clear validation errors when user starts typing
        $('#editUsername').on('input', function() {
            $('#usernameError').hide();
            $(this).removeClass('is-invalid');
        });
        
        $('#editEmail').on('input', function() {
            $('#emailError').hide();
            $(this).removeClass('is-invalid');
        });
        
        // Clear password errors when user starts typing
        $('#newPassword, #confirmPassword').on('input', function() {
            $('#passwordError').hide();
            $('#confirmPassword').removeClass('is-invalid');
        });
        
        // Handle password confirmation validation
        $('#confirmPassword').on('input', function() {
            const newPassword = $('#newPassword').val();
            const confirmPassword = $(this).val();
            
            if (confirmPassword && newPassword !== confirmPassword) {
                $('#passwordError').show();
                $(this).addClass('is-invalid');
            } else {
                $('#passwordError').hide();
                $(this).removeClass('is-invalid');
            }
        });
        
        // Interest selection change
        $('input[name="interestCategory"]').on('change', InterestsManager.handleInterestChange);
        
        // Form submissions
        $('#editProfileForm').on('submit', InterestsManager.saveProfile);
        $('#interestsForm').on('submit', InterestsManager.saveInterests);
        
        // Button clicks
        $('#saveInterests').on('click', InterestsManager.saveInterests);
        $('#resetInterests').on('click', InterestsManager.resetInterests);
        $('#cancelEdit').on('click', InterestsManager.cancelEdit);
    },

    // Load user profile - Using direct $.ajax
    loadUserProfile: async function() {
        try {
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }

            const userId = getUserIdFromStorage();
            if (!userId) {
                showAlert('danger', 'Invalid user data');
                return;
            }

            // Load user data from database
            $.ajax({
                type: 'GET',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/GetById/${userId}`,
                cache: false,
                dataType: "json",
                success: function(userData) {
                    // Populate form with current user data
                    $('#editUsername').val(userData.username || '');
                    $('#editEmail').val(userData.email || '');
                    $('#firstName').val(userData.firstName || '');
                    $('#lastName').val(userData.lastName || '');
                    
                    // Load notification preferences from database
                    $('#notifyOnLikes').prop('checked', userData.notifyOnLikes !== false);
                    $('#notifyOnComments').prop('checked', userData.notifyOnComments !== false);
                    $('#notifyOnFollows').prop('checked', userData.notifyOnFollow !== false);
                    $('#notifyOnShares').prop('checked', userData.notifyOnShare !== false);

                    // Update likes received count - calculate dynamically from shared articles
                    InterestsManager.loadLikesReceivedCount(userData.id);
                    
                    // Update member since date
                    if (userData.registrationDate) {
                        const registrationDate = new Date(userData.registrationDate);
                        const options = { year: 'numeric', month: 'long' };
                        const formattedDate = registrationDate.toLocaleDateString('en-US', options);
                        $('#memberSince').text(`Member since ${formattedDate}`);
                    } else {
                        $('#memberSince').text('Member since unknown');
                    }

                    // Update avatar based on activity level
                    InterestsManager.updateUserAvatar(userData.activityLevel || 0);
                    InterestsManager.updateActivityProgress(userData.activityLevel || 0);

                    console.log('✅ User profile loaded successfully');
                },
                error: function(xhr, status, error) {
                    console.error('Error loading user profile:', error);
                    showAlert('danger', 'Failed to load user profile');
                }
            });
        } catch (error) {
            console.error('Error loading user profile:', error);
            showAlert('danger', 'Failed to load user profile');
        }
    },

    // Load user interests - Using direct $.ajax
    loadUserInterests: function () {
        const userId = getUserIdFromStorage();
        if (!userId) {
            console.warn("⚠️ No userId found in localStorage.");
            return;
        }

        $.ajax({
            type: 'GET',
            url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/interests/${userId}`,
            cache: false,
            dataType: "json",
            success: function (tags) {
                InterestsManager.currentInterests = Array.isArray(tags) ? tags : [];

                if (InterestsManager.currentInterests.length > 0) {
                    InterestsManager.currentInterests.forEach(category => {
                        $(`input[name="interestCategory"][value="${category}"]`).prop('checked', true);
                    });
                    $('#saveInterests').prop('disabled', false);
                    $('#resetInterests').prop('disabled', false);
                    console.log("✅ Interests loaded:", tags);
                } else {
                    console.log("📝 No interests found for user");
                    $('input[name="interestCategory"]').prop('checked', false);
                    $('#saveInterests').prop('disabled', true);
                    $('#resetInterests').prop('disabled', true);
                }
            },
            error: function (xhr, status, error) {
                console.warn("⚠️ Failed to load user interests:", error);
            }
        });
    },

    // Load following stats
    loadFollowingStats: function() {
        const userId = getUserIdFromStorage();
        if (!userId) {
            console.warn("⚠️ No userId found in localStorage.");
            return;
        }

        $.ajax({
            type: 'GET',
            url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/following-stats?userId=${userId}`,
            cache: false,
            dataType: "json",
            success: function(response) {
                if (response && response.success && response.stats) {
                    $('#followingCount').text(response.stats.following || 0);
                    $('#followersCount').text(response.stats.followers || 0);
                    console.log("✅ Following stats loaded:", response.stats);
                } else {
                    console.log("📝 No following stats found");
                    $('#followingCount').text('0');
                    $('#followersCount').text('0');
                }
            },
            error: function(xhr, status, error) {
                console.warn("⚠️ Failed to load following stats:", error);
                $('#followingCount').text('0');
                $('#followersCount').text('0');
            }
        });
    },

    // Update user avatar based on activity level
    updateUserAvatar: function(activityLevel) {
        // Use centralized avatar system
        if (window.getAvatarSource && window.getTierName) {
            const avatarSrc = window.getAvatarSource(activityLevel);
            const tierName = window.getTierName(activityLevel);
            
            $('#userAvatar').attr('src', avatarSrc);
            $('#tierName').text(tierName);
        } else {
            // Fallback to local implementation
            let avatarSrc = '../assets/default-avatar.png';
            let tierName = 'Member';
            
            if (activityLevel >= 50) {
                avatarSrc = '../assets/avatar-legend.png';
                tierName = 'Legend';
            } else if (activityLevel >= 30) {
                avatarSrc = '../assets/avatar-master.png';
                tierName = 'Master';
            } else if (activityLevel >= 20) {
                avatarSrc = '../assets/avatar-expert.png';
                tierName = 'Expert';
            } else if (activityLevel >= 10) {
                avatarSrc = '../assets/avatar-active.png';
                tierName = 'Active';
            } else {
                avatarSrc = '../assets/avatar-reader.png';
                tierName = 'Reader';
            }
            
            $('#userAvatar').attr('src', avatarSrc);
            $('#tierName').text(tierName);
        }
    },

    // Update activity progress bar with more detailed information
    updateActivityProgress: function(activityLevel) {
        console.log('📊 Updating activity progress:', activityLevel);
        
        const currentLevel = Math.floor(activityLevel / 10);
        const nextLevel = currentLevel + 1;
        const pointsInCurrentLevel = activityLevel % 10;
        const progress = pointsInCurrentLevel * 10;
        
        $('#activityBar').css('width', `${progress}%`);
        
        if (activityLevel >= 50) {
            $('#activityText').text(`${activityLevel} points (Legend level reached!)`);
        } else {
            const pointsToNext = 10 - pointsInCurrentLevel;
            $('#activityText').text(`${activityLevel} points (${pointsToNext} to next level)`);
        }
        
        // Update the progress bar color based on level
        const $progressBar = $('#activityBar');
        $progressBar.removeClass('bg-primary bg-success bg-warning bg-info');
        
        if (activityLevel >= 50) {
            $progressBar.addClass('bg-success'); // Legend - Green
        } else if (activityLevel >= 30) {
            $progressBar.addClass('bg-primary'); // Master - Blue
        } else if (activityLevel >= 20) {
            $progressBar.addClass('bg-info'); // Expert - Light Blue
        } else if (activityLevel >= 10) {
            $progressBar.addClass('bg-warning'); // Active - Yellow
        } else {
            $progressBar.addClass('bg-primary'); // Reader - Blue
        }
        
        console.log('✅ Activity progress updated successfully');
    },

    // Load likes received count dynamically from shared articles
    loadLikesReceivedCount: function(userId) {
        if (!userId) return;

        console.log('🔍 Loading likes received count for userId:', userId);

        ajaxCall(
            'GET',
            `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared?userId=${userId}`,
            null,
            function(response) {
                console.log('📊 Shared articles response:', response);
                
                if (response && response.success && response.articles) {
                    // Calculate total likes received from all user's shared articles
                    let totalLikes = 0;
                    const currentUserId = parseInt(userId);
                    
                    response.articles.forEach(article => {
                        console.log('📝 Article:', article.id, 'userId:', article.userId, 'likes:', article.likes);
                        if (article.userId === currentUserId) {
                            totalLikes += article.likes || 0;
                        }
                    });
                    
                    $('#likesReceived').text(totalLikes);
                    console.log('✅ Likes received count loaded:', totalLikes);
                } else {
                    $('#likesReceived').text('0');
                    console.log('📝 No shared articles found for likes count');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading likes received count:', error);
                $('#likesReceived').text('0');
            }
        );
    },


    // Save profile changes
    saveProfile: async function(e) {
        e.preventDefault();
    
        console.log('🚀 STARTING COMPLETELY NEW SAVE PROFILE FUNCTION');
    
        const profileData = {
            username: $('#editUsername').val().trim(),
            email: $('#editEmail').val().trim(),
            firstName: $('#firstName').val().trim(),
            lastName: $('#lastName').val().trim(),
            newPassword: $('#newPassword').val().trim(),
            confirmPassword: $('#confirmPassword').val().trim(),
            notifyOnLikes: $('#notifyOnLikes').is(':checked'),
            notifyOnComments: $('#notifyOnComments').is(':checked'),
            notifyOnFollow: $('#notifyOnFollows').is(':checked'),
            notifyOnShare: $('#notifyOnShares').is(':checked')
        };

        // Basic validation
        if (!profileData.username || !profileData.email || !profileData.firstName || !profileData.lastName) {
            showAlert('warning', 'Please fill in all required fields!');
            return;
        }
    
        if (profileData.username.length < 3) {
            showAlert('warning', 'Username must be at least 3 characters long!');
            return;
        }
    
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            showAlert('warning', 'Please enter a valid email address!');
            return;
        }
    
        // Password validation
        if (profileData.newPassword || profileData.confirmPassword) {
            if (!profileData.newPassword) {
                showAlert('warning', 'Please enter a new password!');
                return;
            }
            if (!profileData.confirmPassword) {
                showAlert('warning', 'Please confirm your new password!');
                return;
            }
            if (profileData.newPassword.length < 6) {
                showAlert('warning', 'Password must be at least 6 characters long!');
                return;
            }
            if (profileData.newPassword !== profileData.confirmPassword) {
                $('#passwordError').show();
                $('#confirmPassword').addClass('is-invalid');
                return;
            }
        }
    
        // Clear any previous password errors
        $('#passwordError').hide();
        $('#confirmPassword').removeClass('is-invalid');
    
        const button = $('#saveProfile');
        button.prop('disabled', true);
        button.html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');
    
        try {
            const userId = getUserIdFromStorage();
            console.log('🔍 User ID:', userId);
        
            const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
            console.log('🔍 Current user:', currentUser);
        
            const isPasswordUpdate = profileData.newPassword && profileData.confirmPassword;
        
            // Get current password for verification
            const currentPassword = prompt('Please enter your current password to confirm the changes:');
            if (!currentPassword || currentPassword.trim() === '') {
                showAlert('warning', 'Password confirmation required to update your profile.');
                button.prop('disabled', false);
                button.html('<i class="fas fa-save me-2"></i>Save Changes');
                return;
            }
        
            // Build the update request object according to the API specification
            const updateRequest = {
                CurrentPassword: currentPassword,
                Username: profileData.username,
                Email: profileData.email,
                FirstName: profileData.firstName,
                LastName: profileData.lastName,
                NewPassword: isPasswordUpdate ? profileData.newPassword : null,
                NotifyOnLikes: profileData.notifyOnLikes,
                NotifyOnComments: profileData.notifyOnComments,
                NotifyOnFollow: profileData.notifyOnFollow,
                NotifyOnShare: profileData.notifyOnShare
            };
        
            console.log('🔍 Update request to send:', updateRequest);
        
            // Make the profile update API call using the correct endpoint
            console.log('🚀 Making profile update API call...');
            const profileApiUrl = `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Users/Update/${userId}`;
            console.log('🌐 Profile API URL:', profileApiUrl);
        
            try {
                const profileResult = await $.ajax({
                    type: 'PUT',
                    url: profileApiUrl,
                    contentType: 'application/json',
                    data: JSON.stringify(updateRequest),
                    dataType: "json",
                    cache: false,
                    timeout: 30000,
                    beforeSend: function(xhr) {
                        console.log('📤 Sending profile update request to:', profileApiUrl);
                        console.log('📤 Request data:', JSON.stringify(updateRequest));
                    }
                });
            
                console.log('✅ Profile update response:', profileResult);
            
                // Success handling
                console.log('🎉 Profile update completed successfully!');
            
                // Update localStorage with new user data
                const updatedUser = { 
                    ...currentUser, 
                    username: profileData.username,
                    email: profileData.email,
                    firstName: profileData.firstName,
                    lastName: profileData.lastName,
                    notifyOnLikes: profileData.notifyOnLikes,
                    notifyOnComments: profileData.notifyOnComments,
                    notifyOnFollow: profileData.notifyOnFollow,
                    notifyOnShare: profileData.notifyOnShare
                };
                localStorage.setItem('userInfo', JSON.stringify(updatedUser));
                console.log('💾 Local storage updated');
            
                // Clear password fields
                $('#newPassword').val('');
                $('#confirmPassword').val('');
            
                // Update navbar if needed
                if (typeof updateNavbarForUser === 'function') {
                    updateNavbarForUser();
                }
            
                showAlert('success', 'Profile updated successfully!');
            
            } catch (profileError) {
                console.error('❌ Profile update failed:', profileError);
                console.error('❌ Error details:', {
                    status: profileError.status,
                    statusText: profileError.statusText,
                    responseText: profileError.responseText
                });
            
                let errorMessage = 'Failed to update profile. Please try again.';
                
                // Handle specific error cases
                if (profileError.status === 400) {
                    // Try to parse error response for more specific messages
                    if (profileError.responseJSON && profileError.responseJSON.message) {
                        errorMessage = profileError.responseJSON.message;
                    } else if (profileError.responseText) {
                        try {
                            const errorResponse = JSON.parse(profileError.responseText);
                            if (errorResponse.message) {
                                errorMessage = errorResponse.message;
                            }
                        } catch (e) {
                            errorMessage = 'Invalid request. Please check your input and try again.';
                        }
                    } else {
                        errorMessage = 'Invalid request. Please check your input and try again.';
                    }
                } else if (profileError.status === 401) {
                    errorMessage = 'Current password is incorrect.';
                } else if (profileError.status === 404) {
                    errorMessage = 'User not found.';
                } else if (profileError.status === 500) {
                    errorMessage = 'Server error. Please try again later.';
                }
            
                showAlert('danger', errorMessage);
            }
        
        } catch (generalError) {
            console.error('❌ General error in saveProfile:', generalError);
            showAlert('danger', 'An unexpected error occurred. Please try again.');
        
        } finally {
            button.prop('disabled', false);
            button.html('<i class="fas fa-save me-2"></i>Save Changes');
            console.log('🏁 Save profile function completed');
        }
    },

    // Cancel profile edit
    cancelEdit: function() {
        InterestsManager.loadUserProfile(); // Reset form to original values
        showAlert('info', 'Changes cancelled');
    },

    // Handle interest selection change
    handleInterestChange: function () {
        const anyChecked = $('input[name="interestCategory"]:checked').length > 0;
        $('#saveInterests').prop('disabled', !anyChecked);
        $('#resetInterests').prop('disabled', !anyChecked);
    },

    // Save user interests - Using direct $.ajax
    saveInterests: function () {
        const selectedInterests = $('input[name="interestCategory"]:checked')
            .map(function () {
                return $(this).val();
            }).get();

        if (selectedInterests.length === 0) {
            showAlert('warning', 'Please select at least one interest category');
            return;
        }

        const userId = getUserIdFromStorage();
        if (!userId) {
            showAlert('warning', 'User ID missing');
            return;
        }

        $.ajax({
            type: 'POST',
            url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/interests',
            contentType: "application/json",
            dataType: "json",
            data: JSON.stringify({
                userId: parseInt(userId),
                categories: selectedInterests
            }),
            success: function (response) {
                showAlert('success', 'Interests saved!');
                console.log("✅ Interests saved:", selectedInterests);
            },
            error: function (xhr, status, error) {
                console.error('❌ Error saving interests:', error);
                showAlert('danger', 'Failed to save interests');
            }
        });
    },

    // Reset user interests
    resetInterests: function () {
        const userId = getUserIdFromStorage();

        if (!userId) {
            showAlert("warning", "User ID not found. Please login again.");
            return;
        }

        if (!confirm("Are you sure you want to clear your interest preference?")) {
            return;
        }

        $.ajax({
            type: 'DELETE',
            url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/interests/${userId}`,
            cache: false,
            success: function () {
                InterestsManager.currentInterests = [];

                // Clear form UI
                $('input[name="interestCategory"]').prop('checked', false);
                $('#saveInterests').prop('disabled', true);
                $('#resetInterests').prop('disabled', true);

                // Clear localStorage backup if any
                localStorage.removeItem('userInterests');

                showAlert("success", "Your interest preference has been cleared.");
                console.log("✅ User interests cleared.");
            },
            error: function (xhr, status, error) {
                console.error("❌ Failed to clear interests:", error);
                showAlert("danger", "Could not clear your interest preference.");
            }
        });
    },


    // Get user's current interests
    getCurrentInterests: function() {
        return InterestsManager.currentInterests.slice(); // Return a copy
    },

    // Check if user has a specific interest
    hasInterest: function(category) {
        return InterestsManager.currentInterests.includes(category);
    },

    // Add interest (programmatically)
    addInterest: function(category) {
        if (!InterestsManager.availableCategories.includes(category)) {
            console.warn('Invalid category:', category);
            return false;
        }
        
        if (!InterestsManager.hasInterest(category)) {
            InterestsManager.currentInterests.push(category);
            return true;
        }
        
        return false;
    },

    // Remove interest (programmatically)
    removeInterest: function(category) {
        const index = InterestsManager.currentInterests.indexOf(category);
        if (index > -1) {
            InterestsManager.currentInterests.splice(index, 1);
            return true;
        }
        
        return false;
    },

    // Get interest display name
    getInterestDisplayName: function(category) {
        const displayNames = {
            'general': 'General News',
            'business': 'Business',
            'technology': 'Technology',
            'science': 'Science',
            'sports': 'Sports',
            'entertainment': 'Entertainment',
            'health': 'Health',
            'politics': 'Politics',
            'breaking': 'Breaking News'
        };
        
        return displayNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
    },

    // Get interest icon
    getInterestIcon: function(category) {
        const icons = {
            'general': 'fas fa-newspaper',
            'business': 'fas fa-chart-line text-success',
            'technology': 'fas fa-laptop-code text-info',
            'science': 'fas fa-flask text-primary',
            'sports': 'fas fa-futbol text-warning',
            'entertainment': 'fas fa-film text-purple',
            'health': 'fas fa-heart text-danger',
            'politics': 'fas fa-university text-secondary',
            'breaking': 'fas fa-exclamation-triangle text-warning'
        };
        
        return icons[category] || 'fas fa-newspaper';
    },

    // Export user interests (for backup)
    exportInterests: function() {
        try {
            const exportData = {
                interests: InterestsManager.currentInterests,
                exportDate: new Date().toISOString(),
                username: Auth.getCurrentUser().username
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `interests-${Auth.getCurrentUser().username}-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showAlert('success', 'Interests exported successfully');
        } catch (error) {
            console.error('Error exporting interests:', error);
            showAlert('danger', 'Failed to export interests');
        }
    },

    // Import user interests (from backup)
    importInterests: function(fileData) {
        try {
            const importData = JSON.parse(fileData);
            
            if (importData.interests && Array.isArray(importData.interests)) {
                // Validate interests
                const validInterests = importData.interests.filter(interest => 
                    InterestsManager.availableCategories.includes(interest)
                );
                
                if (validInterests.length > 0) {
                    InterestsManager.currentInterests = validInterests;
                    
                    // Update UI
                    $('input[name="interestCategory"]').prop('checked', false);
                    if (validInterests.length > 0) {
                        $(`input[name="interestCategory"][value="${validInterests[0]}"]`).prop('checked', true);
                        $('#saveInterests').prop('disabled', false);
                        $('#resetInterests').prop('disabled', false);
                    }
                    
                    showAlert('success', `Imported ${validInterests.length} interest(s) successfully`);
                    console.log('✅ Interests imported:', validInterests);
                } else {
                    showAlert('warning', 'No valid interests found in import data');
                }
            } else {
                showAlert('danger', 'Invalid import data format');
            }
        } catch (error) {
            console.error('Error importing interests:', error);
            showAlert('danger', 'Failed to import interests - invalid file format');
        }
    }
};

// Profile management functionality (originally in interests.html script)
function loadUserProfile() {
    InterestsManager.loadUserProfile();
}

function saveProfile(e) {
    return InterestsManager.saveProfile(e);
}

function cancelEdit() {
    return InterestsManager.cancelEdit();
}

// Initialize interests manager when page loads
$(document).ready(function() {
    if (window.location.pathname.indexOf('interests.html') !== -1 || 
        window.location.href.indexOf('interests.html') !== -1) {
        InterestsManager.init();
    }
});

// Make InterestsManager globally available
window.InterestsManager = InterestsManager;