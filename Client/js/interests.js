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
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Profile form submission
        $('#editProfileForm').on('submit', InterestsManager.saveProfile);
        $('#cancelEdit').on('click', InterestsManager.cancelEdit);
        
        // Interest management
        $('#saveInterests').on('click', InterestsManager.saveInterests);
        $('#resetInterests').on('click', InterestsManager.resetInterests);
        
        // Interest category selection
        $('input[name="interestCategory"]').on('change', InterestsManager.handleInterestChange);
    },

    // Load user profile - Using direct $.ajax
    loadUserProfile: async function() {
        try {
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }

            const currentUser = Auth.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                showAlert('danger', 'Invalid user data');
                return;
            }

            // Populate form with current user data
            $('#editUsername').val(currentUser.username || '');
            $('#editEmail').val(currentUser.email || '');
            
            // Load notification preferences from localStorage (since backend doesn't support them yet)
            const notifyOnLikes = localStorage.getItem('notifyOnLikes') !== 'false';
            const notifyOnComments = localStorage.getItem('notifyOnComments') !== 'false';
            const notifyOnFollows = localStorage.getItem('notifyOnFollows') !== 'false';
            const notifyOnShares = localStorage.getItem('notifyOnShares') !== 'false';
            
            $('#notifyOnLikes').prop('checked', notifyOnLikes);
            $('#notifyOnComments').prop('checked', notifyOnComments);
            $('#notifyOnFollows').prop('checked', notifyOnFollows);
            $('#notifyOnShares').prop('checked', notifyOnShares);

            console.log('✅ User profile loaded successfully');
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
            url: `http://localhost:5121/api/users/interests/${userId}`,
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



    // Save user profile - Using direct $.ajax
    saveProfile: async function(e) {
        e.preventDefault();
        
        const profileData = {
            username: $('#editUsername').val().trim(),
            email: $('#editEmail').val().trim(),
            notifyOnLikes: $('#notifyOnLikes').is(':checked'),
            notifyOnComments: $('#notifyOnComments').is(':checked'),
            notifyOnFollow: $('#notifyOnFollows').is(':checked'),
            notifyOnShare: $('#notifyOnShares').is(':checked')
        };

        // Basic validation
        if (!profileData.username || !profileData.email) {
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
        
        try {
            const button = $('#saveProfile');
            button.prop('disabled', true);
            button.html('<i class="fas fa-spinner fa-spin me-2"></i>Saving...');
            
            // Use Auth.updateProfile which calls the backend
            const result = await Auth.updateProfile(profileData);
            
            if (result.success) {
                // Save notification preferences to localStorage since backend doesn't support them yet
                localStorage.setItem('notifyOnLikes', profileData.notifyOnLikes);
                localStorage.setItem('notifyOnComments', profileData.notifyOnComments);
                localStorage.setItem('notifyOnFollows', profileData.notifyOnFollow);
                localStorage.setItem('notifyOnShares', profileData.notifyOnShare);
                
                showAlert('success', 'Profile updated successfully!');
                
                // Update navbar if needed
                if (typeof updateNavbarForUser === 'function') {
                    updateNavbarForUser();
                }
            } else {
                showAlert('danger', result.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            showAlert('danger', 'Error updating profile. Please try again.');
        } finally {
            const button = $('#saveProfile');
            button.prop('disabled', false);
            button.html('<i class="fas fa-save me-2"></i>Save Changes');
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
            url: 'http://localhost:5121/api/users/interests',
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
            url: `http://localhost:5121/api/users/interests/${userId}`,
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