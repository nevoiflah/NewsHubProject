// auth.js 
$(document).ready(function() {
    console.log('🔐 Auth module loaded with jQuery');
});


const baseUrl = 'http://localhost:5121/api';

// Helper function to get user interests 
async function getUserInterests(userId) {
    return new Promise((resolve) => {
        
        $.ajax({
            type: 'GET',
            url: `${baseUrl}/users/interests`,
            cache: false,
            dataType: "json",
            data: {
                userId: Auth.getCurrentUser().id
            },
            success: function(response) {
                if (response && response.categories) {
                    console.log('📝 User interests:', response.categories);
                    resolve(response.categories);
                } else {
                    resolve(['general']); // Default interest
                }
            },
            error: function(xhr, status, error) {
                console.warn('⚠️ Could not load user interests:', error);
                resolve(['general']);
            }
        });
    });
}

// Function to clear problematic session storage for notifications
function resetNotificationPrompts() {
    sessionStorage.removeItem('notificationPromptShown');
    sessionStorage.removeItem('notificationPromptDismissed');
    console.log('🔄 Notification prompt state reset');
}

const Auth = {
    // Check if user is logged in
    isLoggedIn: () => {
        return localStorage.getItem('userInfo') !== null;
    },

    // Get current user info
    getCurrentUser: () => {
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    },

    // Login user - Using direct $.ajax
    login: async (username, password) => {
        return new Promise((resolve) => {
            console.log('🌐 Frontend: Starting login request...');
            
            $.ajax({
                type: 'POST',
                url: `${baseUrl}/Users/login`,
                data: JSON.stringify({ 
                    Username: username, 
                    Password: password
                }),
                cache: false,
                contentType: "application/json",
                dataType: "json",
                timeout: 30000,
                success: function(response) {
                    console.log('📥 Frontend: Raw API response:', response);

                    // ✅ FIXED: Check for response.user.id instead of response.id
                    if (response && response.user && response.user.id) {
                        console.log('✅ Frontend: Login successful, storing data...');
                        
                        // ✅ FIXED: Access data from response.user object
                        localStorage.setItem('userInfo', JSON.stringify({
                            id: response.user.id,
                            username: response.user.username,
                            email: response.user.email,
                            isAdmin: response.user.isAdmin
                        }));

                        // Store userId directly for backward compatibility
                        localStorage.setItem('userId', response.user.id);

                        console.log('💾 Frontend: User data stored in localStorage');
                        resolve({ success: true, message: 'Login successful' });
                    } else {
                        console.log('❌ Frontend: Invalid response format');
                        resolve({ success: false, error: 'Invalid response from server' });
                    }
                },
                error: function(xhr, status, error) {
                    console.error('❌ Frontend: Login failed:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        error: error
                    });

                    let errorMessage = 'Login failed';
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || errorResponse.error || errorMessage;
                    } catch (e) {
                        // Use default error message
                    }

                    resolve({ success: false, error: errorMessage });
                }
            });
        });
    },

    // Register user 
    register: (username, email, password, onSuccess, onError) => {
    const firstName = $('#firstName').val().trim();
    const lastName = $('#lastName').val().trim();

    const userPayload = JSON.stringify({
        Username: username,
        Email: email,
        PasswordHash: password,
        FirstName: firstName,
        LastName: lastName
    });

    ajaxCall(
        'POST',
        `${baseUrl}/Users/register`,
        userPayload,
        function (response) {
            const isSuccess =
                response === "User registered successfully." ||
                (response && response.success);

            if (isSuccess) {
                onSuccess("Registration successful");
            } else {
                onError("Registration failed");
            }
        },
        function () {
            onError("Registration failed");
        }
    );
}
,

    // Update profile 
    updateProfile: async (profileData) => {
        return new Promise((resolve) => {
            const user = Auth.getCurrentUser();

            $.ajax({
                type: 'PUT',
                url: `${baseUrl}/Users/Update/${user.id}`,
                data: JSON.stringify(profileData),
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function (response) {
                    console.log('📥 Profile update response:', response);

                    if (response && response === "User updated successfully.") {
                        // Update local storage
                        const updatedUser = { ...user, ...profileData };
                        localStorage.setItem('userInfo', JSON.stringify(updatedUser));

                        console.log('✅ Profile updated successfully');
                        resolve({ success: true, message: 'Profile updated successfully' });
                    } else {
                        console.log('❌ Profile update failed');
                        resolve({ success: false, error: 'Profile update failed' });
                    }
                },
                error: function (xhr, status, error) {
                    console.error('❌ Profile update error:', {
                        status: xhr.status,
                        statusText: xhr.statusText,
                        responseText: xhr.responseText,
                        error: error
                    });

                    let errorMessage = 'Profile update failed';
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || errorResponse.error || errorMessage;
                    } catch (e) {
                        // Use default error message
                    }

                    resolve({ success: false, error: errorMessage });
                }
            });
        });
    },

    // Save user interests 
    saveInterests: async (categories) => {
        return new Promise((resolve) => {
            const userId = Auth.getCurrentUser().id;

            $.ajax({
                type: 'POST',
                url: `${baseUrl}/tags/save/${userId}`,
                data: JSON.stringify(categories), // רק מערך של IDs
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function (response) {
                    if (response && response.success) {
                        console.log('✅ Interests saved successfully');
                        resolve({ success: true, message: 'Interests saved successfully' });
                    } else {
                        resolve({ success: false, error: 'Failed to save interests' });
                    }
                },
                error: function (xhr, status, error) {
                    console.error('❌ Error saving interests:', error);

                    let errorMessage = 'Failed to save interests';
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        errorMessage = errorResponse.message || errorResponse.error || errorMessage;
                    } catch (e) {
                        // Default message
                    }

                    resolve({ success: false, error: errorMessage });
                }
            });
        });
    },

    // Get user interests 
    getInterests: async () => {
        return new Promise((resolve) => {
            const userId = Auth.getCurrentUser().id;

            $.ajax({
                type: 'GET',
                url: `${baseUrl}/tags/${userId}`,
                cache: false,
                dataType: "json",
                success: function (response) {
                    if (Array.isArray(response)) {
                        resolve({ success: true, categories: response });
                    } else {
                        resolve({ success: true, categories: ['general'] });
                    }
                },
                error: function (xhr, status, error) {
                    console.error('❌ Error loading interests:', error);
                    resolve({ success: false, error: 'Failed to load interests' });
                }
            });
        });
    },

    // Check if user is admin
    isAdmin: () => {
        const userInfo = Auth.getCurrentUser();
        return userInfo.isAdmin === true;
    },

    // Logout user
    logout: () => {
        console.log('🚪 Frontend: Logging out user...');
        
        try {
            if (window.NotificationService && window.NotificationService.cleanup) {
                window.NotificationService.cleanup();
            }
        } catch (e) {
            console.warn('Error cleaning up notifications:', e);
        }
        
        localStorage.removeItem('userInfo');
        localStorage.removeItem('userId');
        localStorage.removeItem('fcmToken');
        
        console.log('🧹 Frontend: Local storage cleared');
        window.location.href = 'index.html';
    },

    // Require authentication
    requireAuth: () => {
        if (!Auth.isLoggedIn()) {
            console.log('🔒 Authentication required, redirecting to login...');
            window.location.href = 'login.html';
            return false;
        }
        return true;
    },

    // Require admin access
    requireAdmin: () => {
        if (!Auth.isLoggedIn() || !Auth.isAdmin()) {
            console.log('🔒 Admin access required, redirecting...');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
};

// Password validation function
function validatePassword(password) {
    const minLength = 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Email validation function
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Username validation function
function validateUsername(username) {
    const minLength = 3;
    const maxLength = 30;
    const validChars = /^[a-zA-Z0-9_-]+$/;
    
    const errors = [];
    
    if (username.length < minLength) {
        errors.push(`Username must be at least ${minLength} characters long`);
    }
    
    if (username.length > maxLength) {
        errors.push(`Username must be no more than ${maxLength} characters long`);
    }
    
    if (!validChars.test(username)) {
        errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Form validation and submission handlers
$(document).ready(function() {
    // Real-time password validation
    $('#regPassword, #password').on('input', function() {
        const password = $(this).val();
        const validation = validatePassword(password);
        const $feedback = $(this).siblings('.password-feedback');
        
        if (password.length > 0) {
            if (validation.isValid) {
                $feedback.removeClass('text-danger').addClass('text-success').text('✓ Password meets requirements');
            } else {
                $feedback.removeClass('text-success').addClass('text-danger').html(validation.errors.join('<br>'));
            }
            $feedback.show();
        } else {
            $feedback.hide();
        }
    });
    
    // Real-time email validation
    $('#regEmail, #email').on('input', function() {
        const email = $(this).val();
        const $feedback = $(this).siblings('.email-feedback');
        
        if (email.length > 0) {
            if (validateEmail(email)) {
                $feedback.removeClass('text-danger').addClass('text-success').text('✓ Valid email address');
            } else {
                $feedback.removeClass('text-success').addClass('text-danger').text('✗ Invalid email address');
            }
            $feedback.show();
        } else {
            $feedback.hide();
        }
    });
    
    // Real-time username validation
    $('#regUsername, #username').on('input', function() {
        const username = $(this).val();
        const validation = validateUsername(username);
        const $feedback = $(this).siblings('.username-feedback');
        
        if (username.length > 0) {
            if (validation.isValid) {
                $feedback.removeClass('text-danger').addClass('text-success').text('✓ Valid username');
            } else {
                $feedback.removeClass('text-success').addClass('text-danger').html(validation.errors.join('<br>'));
            }
            $feedback.show();
        } else {
            $feedback.hide();
        }
    });
    
    // Password confirmation validation
    $('#regConfirmPassword').on('input', function() {
        const password = $('#regPassword').val();
        const confirmPassword = $(this).val();
        const $feedback = $(this).siblings('.confirm-password-feedback');
        
        if (confirmPassword.length > 0) {
            if (password === confirmPassword) {
                $feedback.removeClass('text-danger').addClass('text-success').text('✓ Passwords match');
            } else {
                $feedback.removeClass('text-success').addClass('text-danger').text('✗ Passwords do not match');
            }
            $feedback.show();
        } else {
            $feedback.hide();
        }
    });

    // FIXED: Check authentication on protected pages
    setTimeout(function() {
        const protectedPages = ['news.html', 'saved.html', 'shared.html', 'interests.html', 'maps.html'];
        const adminPages = ['admin.html'];
        const currentPath = window.location.pathname;
        const currentFile = currentPath.split('/').pop(); // Gets just the filename like "news.html"
        
        console.log('🔐 Checking auth for page:', currentFile);
        console.log('🔐 Full path:', currentPath);
        
        // Check protected pages
        if (protectedPages.includes(currentFile)) {
            if (!window.Auth || !window.Auth.isLoggedIn()) {
                console.log('🚫 Redirecting to login - protected page requires auth');
                const currentUrl = encodeURIComponent(window.location.href);
                window.location.href = `login.html?redirect=${currentUrl}`;
                return;
            }
            console.log('✅ User authenticated for protected page');
        }
        
        // Check admin pages
        if (adminPages.includes(currentFile)) {
            if (!window.Auth || !window.Auth.isLoggedIn()) {
                console.log('🚫 Redirecting to login - admin page requires auth');
                const currentUrl = encodeURIComponent(window.location.href);
                window.location.href = `login.html?redirect=${currentUrl}`;
                return;
            }
            if (!window.Auth.isAdmin()) {
                console.log('🚫 Redirecting to home - admin access required');
                window.location.href = 'index.html';
                return;
            }
            console.log('✅ Admin access confirmed');
        }
    }, 100); // Small delay to ensure Auth is loaded
});

// Export Auth for global use
window.Auth = Auth;