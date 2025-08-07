// /js/common.js - FIXED URL ROUTING VERSION WITH STICKY NAVBAR
(function($) {
    'use strict';
    
    console.log('🔧 Loading jQuery-based common utilities...');
    
    // API Configuration
    const API_CONFIG = {
        baseUrl: 'https://localhost:5121/api',
        timeout: 30000
    };

    // FIXED: Helper function to get correct redirect URL based on current location
    function getCorrectRedirectUrl(targetPage = 'news.html') {
        console.log('🔄 Getting redirect URL for:', targetPage);
        return getPageUrl(targetPage);
    }

    function getPageUrl(relativePath) {
        const currentPath = window.location.pathname;
        let basePath = '/';
        if (currentPath.includes('/Client/')) {
            basePath = '/Client/';
        }

        relativePath = relativePath.replace(/^pages\//, '');
        return basePath + 'pages/' + relativePath;
    }

    // Ensure Auth service is always available
    function ensureAuthService() {
        if (!window.Auth) {
            window.Auth = {
                isLoggedIn: () => localStorage.getItem('token') !== null,
                
                getCurrentUser: () => {
                    try {
                        return JSON.parse(localStorage.getItem('userInfo') || '{}');
                    } catch (e) {
                        return {};
                    }
                },
                
                logout: () => {
                    try {
                        if (window.NotificationService && window.NotificationService.cleanup) {
                            window.NotificationService.cleanup();
                        }
                    } catch (e) {
                        console.warn('Error cleaning up notifications:', e);
                    }
                    
                    localStorage.removeItem('userInfo');
                    localStorage.removeItem('fcmToken');
                    
                    // FIXED: Smart redirect for logout using the corrected function
                    window.location.href = getPageUrl('index.html');
                },
                
                // Login method 
                login: async (username, password) => {
                    return new Promise((resolve) => {
                        $.ajax({
                            type: 'POST',
                            url: `${API_CONFIG.baseUrl}/Users/login`,
                            data: JSON.stringify({ username, passwordHash: password }),
                            cache: false,
                            contentType: "application/json",
                            dataType: "json",
                            timeout: API_CONFIG.timeout,
                            success: function(response) {
                                console.log('📥 Backend login response:', response);
                                if (response && response.id) {
                                    localStorage.setItem('userInfo', JSON.stringify({
                                        id: response.id,
                                        username: response.username,
                                        email: response.email,
                                        isAdmin: response.isAdmin,
                                        activityLevel: response.activityLevel || 0
                                    }));
                                    resolve({ success: true, message: 'Login successful' });
                                } else {
                                    resolve({ success: false, error: 'Login failed' });
                                }
                            },
                            error: function(xhr, status, error) {
                                console.error('❌ Login error:', error);
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

                // Register method 
                register: async (username, email, password) => {
                    return new Promise((resolve) => {
                        $.ajax({
                            type: 'POST',
                            url: `${API_CONFIG.baseUrl}/Users/register`,
                            data: JSON.stringify({ username, email, passwordHash: password }),
                            cache: false,
                            contentType: "application/json",
                            dataType: "json",
                            timeout: API_CONFIG.timeout,
                            success: function(response) {
                                if (response && response.id) {
                                    resolve({ success: true, message: 'Registration successful' });
                                } else {
                                    resolve({ success: false, error: 'Registration failed' });
                                }
                            },
                            error: function(xhr, status, error) {
                                let errorMessage = 'Registration failed';
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

                // Update profile method 
                updateProfile: async (profileData) => {
                    return new Promise((resolve) => {
                        $.ajax({
                            type: 'PUT',
                            url: `${API_CONFIG.baseUrl}/Users/profile`,
                            data: JSON.stringify(profileData),
                            cache: false,
                            contentType: "application/json",
                            dataType: "json",
                            timeout: API_CONFIG.timeout,
                            success: function(response) {
                                if (response && response.success) {
                                    // Update local storage
                                    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                                    currentUser.username = profileData.username;
                                    currentUser.email = profileData.email;
                                    localStorage.setItem('userInfo', JSON.stringify(currentUser));
                                    resolve({ success: true, message: 'Profile updated successfully' });
                                } else {
                                    resolve({ success: false, error: 'Profile update failed' });
                                }
                            },
                            error: function(xhr, status, error) {
                                if (xhr.status === 401) {
                                    window.Auth.logout();
                                    return;
                                }
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

                // Check if user is admin
                isAdmin: () => {
                    const userInfo = window.Auth.getCurrentUser();
                    return userInfo.isAdmin === true;
                },

                // Require authentication
                requireAuth: () => {
                    if (!window.Auth.isLoggedIn()) {
                        window.location.href = getPageUrl('login.html');
                        return false;
                    }
                    return true;
                },

                // Require admin access
                requireAdmin: () => {
                    if (!window.Auth.isLoggedIn() || !window.Auth.isAdmin()) {
                        window.location.href = getPageUrl('index.html');
                        return false;
                    }
                    return true;
                }
            };
        }
    }
    
    // Ensure Utils service is always available
    function ensureUtilsService() {
        if (!window.Utils) {
            window.Utils = {
                // Main API call function 
                apiCall: (endpoint, options = {}) => {
                    return new Promise((resolve, reject) => {
                        const url = `${API_CONFIG.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
                        
                        // Prepare data
                        let data = null;
                        if (options.data) {
                            if (options.method === 'GET') {
                                data = options.data;
                            } else {
                                data = JSON.stringify(options.data);
                            }
                        } else if (options.body) {
                            data = options.body;
                        }

                        $.ajax({
                            type: options.method || 'GET',
                            url: url,
                            data: data,
                            cache: false,
                            contentType: options.method === 'GET' ? undefined : "application/json",
                            dataType: "json",
                            timeout: API_CONFIG.timeout,
                            success: function(response) {
                                console.log(`✅ API Success: ${endpoint}`, response);
                                resolve(response);
                            },
                            error: function(xhr, status, error) {
                                console.error(`❌ API Error: ${endpoint}`, {
                                    status: xhr.status,
                                    statusText: xhr.statusText,
                                    responseText: xhr.responseText,
                                    status,
                                    error
                                });
                                
                                // Handle 401 Unauthorized
                                if (xhr.status === 401) {
                                    if (window.Auth && window.Auth.logout) {
                                        window.Auth.logout();
                                    }
                                    reject(new Error('Unauthorized'));
                                    return;
                                }
                                
                                // Try to parse error response
                                let errorMessage = error || 'Network error';
                                try {
                                    const errorResponse = JSON.parse(xhr.responseText);
                                    errorMessage = errorResponse.message || errorResponse.error || errorMessage;
                                } catch (e) {
                                    // Use default error message
                                }
                                
                                reject(new Error(errorMessage));
                            }
                        });
                    });
                },
                
                // Helper function to get API URL
                getApiUrl: (endpoint) => {
                    return `${API_CONFIG.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
                },
                
                sanitizeHtml: (html) => {
                    if (!html) return '';
                    return $('<div>').text(html).html();
                },
                
                formatDate: (dateString) => {
                    if (!dateString) return 'Unknown';
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now - date;
                    const diffMins = Math.floor(diffMs / 60000);
                    const diffHours = Math.floor(diffMs / 3600000);
                    const diffDays = Math.floor(diffMs / 86400000);

                    if (diffMins < 1) return 'Just now';
                    if (diffMins < 60) return `${diffMins} minutes ago`;
                    if (diffHours < 24) return `${diffHours} hours ago`;
                    if (diffDays < 7) return `${diffDays} days ago`;
                    return date.toLocaleDateString();
                },

                truncateText: (text, maxLength = 150) => {
                    if (!text) return '';
                    return text.length > maxLength ? 
                        text.substring(0, maxLength) + '...' : text;
                }
            };
        }
    }

    // Auto-initialize notifications for logged-in users
    async function autoInitializeNotifications() {
        if (!window.NotificationService || !window.Auth) {
            return;
        }

        const currentUser = window.Auth.getCurrentUser();
        if (!currentUser || !currentUser.id) {
            return;
        }

        try {
            console.log(`🔔 Auto-initializing notifications for user: ${currentUser.id} (${currentUser.username})`);
    
            let userInterests = ['general'];
            try {
                const response = await window.Utils.apiCall('/users/interests');
                if (response && response.categories) {
                    userInterests = response.categories;
                }
            } catch (e) {
                console.log('⚠️ Could not load user interests, using defaults');
            }
    
            const success = await window.NotificationService.initializeForUser(
                currentUser.id, 
                userInterests
            );
    
            if (success) {
                console.log('✅ Notifications auto-initialized successfully');
            } else {
                console.log('ℹ️ Notifications require user permission - prompt will be shown');
            }
    
        } catch (error) {
            console.warn('⚠️ Auto-initialization error:', error.message);
        }
    }

    // Load preview news function
    function loadPreviewNews() {
        console.log('🌐 Loading preview news from NewsAPI.org...');

        const API_KEY = '1c92222d21a84a7ab30168a35d967b22';
        const url = `https://newsapi.org/v2/everything?q=*&language=en&sortBy=publishedAt&apiKey=${API_KEY}`;

        $.ajax({
            url: url,
            method: 'GET',
            dataType: 'json',
            success: function(response) {
                console.log('✅ NewsAPI preview loaded:', response);

                if (response && Array.isArray(response.articles) && response.articles.length > 0) {
                    const $container = $('#previewNews');
                    if ($container.length) {
                        const articles = response.articles.slice(0, 3).map(article => `
                            <div class="col-md-4 mb-3">
                                <div class="card h-100">
                                    <img src="${article.urlToImage || '../assets/default-news.jpg'}" 
                                        class="card-img-top" alt="News Image" 
                                        style="height: 200px; object-fit: cover;"
                                        onerror="this.src='../assets/default-news.jpg'">
                                    <div class="card-body d-flex flex-column">
                                        <h6 class="card-title">${$('<div>').text(article.title || 'No title').html()}</h6>
                                        <p class="card-text flex-grow-1">${$('<div>').text((article.description || article.content || 'No description available').substring(0, 100) + '...').html()}</p>
                                        <small class="text-muted">
                                            <i class="fas fa-calendar me-1"></i>
                                            ${article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Unknown date'}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        `).join('');

                        $container.html(articles);
                    }
                } else {
                    $('#previewNews').html(`
                        <div class="col-12">
                            <div class="alert alert-info text-center">
                                <h6>No News Available</h6>
                                <p>No articles are currently available from NewsAPI.org.</p>
                            </div>
                        </div>
                    `);
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ Failed to load preview news from NewsAPI.org:', error);
                $('#previewNews').html(`
                    <div class="col-12 text-center">
                        <div class="alert alert-danger">
                            <h6><i class="fas fa-exclamation-circle me-2"></i>Error Loading News</h6>
                            <p>Unable to fetch latest headlines. Please try again later.</p>
                        </div>
                    </div>
                `);
            }
        });
    }

    // Show alert function - UPDATED with proper positioning
    function showAlert(type, message, duration = 5000) {
        // Remove existing alerts
        $('.alert-custom').remove();
    
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible alert-custom" role="alert" 
                style="position: fixed !important; 
                        top: 100px !important; 
                        right: 20px !important; 
                        z-index: 9999998 !important; 
                        min-width: 300px !important;
                        max-width: 400px !important;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
    
        $('body').append(alertHtml);
    
        // Auto-dismiss after duration
        setTimeout(() => {
            $('.alert-custom').fadeOut();
        }, duration);
    }

    // Initialize when DOM is ready
    function initialize() { 
        ensureAuthService();
        ensureUtilsService();
        
        console.log('✅ jQuery-based common utilities loaded');
        
        // Auto-initialize for already logged-in users
        autoInitializeNotifications();
    }
    
    // Run initialization when document is ready
    $(document).ready(initialize);
    
    // Make functions globally available
    window.loadPreviewNews = loadPreviewNews;
    window.getCorrectRedirectUrl = getCorrectRedirectUrl;
    window.getPageUrl = getPageUrl;
    window.showAlert = showAlert;
    
})(jQuery);

// ============================================================================
// NAVBAR FUNCTIONS
// ============================================================================

// FIXED: Navbar creation with sticky positioning applied directly
function createNavbar() {
    const $container = $('#navbar-container');
    if ($container.length) {
        $container.html(`
            <nav class="navbar navbar-expand-lg navbar-dark" id="mainNavbar">
            <div class="container">
                <a class="navbar-brand" href="${window.getPageUrl('index.html')}">
                <i class="fas fa-newspaper me-2"></i>NewsHub
                </a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                    <a class="nav-link" href="${window.getPageUrl('news.html')}">News</a>
                    </li>
                    <li class="nav-item">
                    <a class="nav-link" href="${window.getPageUrl('saved.html')}">Saved</a>
                    </li>
                    <li class="nav-item">
                    <a class="nav-link" href="${window.getPageUrl('shared.html')}">Community</a>
                    </li>
                    <li class="nav-item">
                    <a class="nav-link" href="${window.getPageUrl('maps.html')}">Map</a>
                    </li>
                    <li class="nav-item">
                    <a class="nav-link" href="${window.getPageUrl('features.html')}">Features</a>
                    </li>
                </ul>
                <ul class="navbar-nav" id="authNav">
                    <!-- Auth buttons will be inserted here -->
                </ul>
                </div>
            </div>
            </nav>
        `);
        
        // FORCE POSITIONING with JavaScript after creation
        setTimeout(() => {
            const navbar = document.getElementById('mainNavbar');
            if (navbar) {
                // Apply styles with maximum priority
                navbar.style.setProperty('position', 'fixed', 'important');
                navbar.style.setProperty('top', '0', 'important');
                navbar.style.setProperty('left', '0', 'important');
                navbar.style.setProperty('right', '0', 'important');
                navbar.style.setProperty('width', '100%', 'important');
                navbar.style.setProperty('z-index', '9999999', 'important');
                navbar.style.setProperty('background', 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)', 'important');
                navbar.style.setProperty('border-bottom', '1px solid #334155', 'important');
                navbar.style.setProperty('backdrop-filter', 'blur(10px)', 'important');
                navbar.style.setProperty('-webkit-backdrop-filter', 'blur(10px)', 'important');
                navbar.style.setProperty('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.1)', 'important');
                
                // Force body padding
                document.body.style.setProperty('padding-top', '80px', 'important');
                document.body.style.setProperty('margin-top', '0', 'important');
                
                console.log('✅ Navbar positioning forced with JavaScript');
                
                // Verify the positioning worked
                const computedStyle = window.getComputedStyle(navbar);
                console.log('📊 Final navbar position:', computedStyle.position);
                console.log('📊 Final navbar top:', computedStyle.top);
                console.log('📊 Final navbar z-index:', computedStyle.zIndex);
            }
        }, 100);
    }
}

// Update navbar for authenticated users
function updateNavbarForUser() {
    const $authNav = $('#authNav');
    if (!$authNav.length) return;
    
    if (window.Auth && window.Auth.isLoggedIn()) {
        const user = window.Auth.getCurrentUser();
        let adminLink = '';
        
        if (user.isAdmin) {
            adminLink = `<li><a class="dropdown-item" href="${window.getPageUrl('admin.html')}">
                <i class="fas fa-cog me-2"></i>Admin Dashboard
            </a></li>`;
        }
        
        // Get user avatar - use activity level to determine avatar
        let avatarSrc = '../assets/default-avatar.png';
        if (user.activityLevel !== undefined) {
            if (user.activityLevel >= 50) {
                avatarSrc = '../assets/avatar-legend.png';
            } else if (user.activityLevel >= 30) {
                avatarSrc = '../assets/avatar-master.png';
            } else if (user.activityLevel >= 20) {
                avatarSrc = '../assets/avatar-expert.png';
            } else if (user.activityLevel >= 10) {
                avatarSrc = '../assets/avatar-active.png';
            } else {
                avatarSrc = '../assets/avatar-reader.png';
            }
        }
        
        $authNav.html(`
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
                    <img src="${avatarSrc}" alt="User Avatar" class="rounded-circle me-2" style="width: 32px; height: 32px; object-fit: cover;">
                    <span>${user.username || 'User'}</span>
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="${window.getPageUrl('saved.html')}">
                        <i class="fas fa-bookmark me-2"></i>Saved Articles
                    </a></li>
                    <li><a class="dropdown-item" href="${window.getPageUrl('interests.html')}">
                        <i class="fas fa-heart me-2"></i>My Interests
                    </a></li>
                    <li><hr class="dropdown-divider"></li>
                    ${adminLink}
                    <li><a class="dropdown-item" href="#" onclick="window.Auth.logout()">
                        <i class="fas fa-sign-out-alt me-2"></i>Logout
                    </a></li>
                </ul>
            </li>
        `);
    } else {
        $authNav.html(`
            <li class="nav-item">
                <a class="nav-link" href="${window.getPageUrl('login.html')}">Login</a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="${window.getPageUrl('register.html')}">Register</a>
            </li>
        `);
    }
}

// ============================================================================
// USER FOLLOWING SYSTEM FUNCTIONS
// ============================================================================

// Follow a user 
async function followUser(userId) {
    return new Promise((resolve) => {
        $.ajax({
            type: 'POST',
            url: `https://localhost:5121/api/users/${userId}/follow`,
            cache: false,
            contentType: "application/json",
            dataType: "json",
            success: function(response) {
                if (response && response.success) {
                    resolve({ success: true, message: response.message });
                } else {
                    resolve({ success: false, error: response?.message || 'Failed to follow user' });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error following user:', error);
                resolve({ success: false, error: 'Network error' });
            }
        });
    });
}

// Unfollow a user 
async function unfollowUser(userId) {
    return new Promise((resolve) => {
        $.ajax({
            type: 'DELETE',
            url: `https://localhost:5121/api/users/${userId}/follow`,
            cache: false,
            contentType: "application/json",
            dataType: "json",
            success: function(response) {
                if (response && response.success) {
                    resolve({ success: true, message: response.message });
                } else {
                    resolve({ success: false, error: response?.message || 'Failed to unfollow user' });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error unfollowing user:', error);
                resolve({ success: false, error: 'Network error' });
            }
        });
    });
}

// ============================================================================
// FORM HANDLERS
// ============================================================================

// Document ready handlers using jQuery
$(document).ready(function() {
    // Create navbar
    createNavbar();
    
    // Check and update navbar for logged-in users
    setTimeout(updateNavbarForUser, 100);

    // FIXED: Login form handler with proper redirect logic
    $('#loginForm').on('submit', async function(e) {
        e.preventDefault();
        
        const username = $('#username').val();
        const password = $('#password').val();
        const $messageDiv = $('#loginMessage');
        
        if (!username || !password) {
            $messageDiv.text('Please enter both username and password').removeClass('d-none');
            return;
        }
        
        // Show loading
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.html();
        $submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Signing in...').prop('disabled', true);
        
        try {
            const result = await window.Auth.login(username, password);
            
            if (result.success) {
                $messageDiv.addClass('d-none');
                window.showAlert('success', 'Login successful! Redirecting...');

                console.log('✅ Login successful');

                setTimeout(() => {
                    // FIXED: Use built-in redirect logic with proper URL handling
                    const redirectParam = new URLSearchParams(window.location.search).get('redirect');
                    let redirectUrl;
                    
                    if (redirectParam) {
                        redirectUrl = redirectParam;
                    } else {
                        // Use smart default based on current location
                        redirectUrl = window.getPageUrl('news.html');
                    }
                    
                    console.log('🔄 Redirecting to:', redirectUrl);
                    window.location.href = redirectUrl;
                }, 1000);
                
            } else {
                $messageDiv.text(result.error || 'Login failed').removeClass('d-none');
            }
            
        } catch (error) {
            console.error('💥 Login error:', error);
            $messageDiv.text('An error occurred. Please try again.').removeClass('d-none');
        } finally {
            $submitBtn.html(originalText).prop('disabled', false);
        }
    });

    // Registration form handler
    $('#registrationForm').on('submit', async function(e) {
        e.preventDefault();
        
        const username = $('#regUsername').val();
        const email = $('#regEmail').val();
        const password = $('#regPassword').val();
        const confirmPassword = $('#regConfirmPassword').val();
        const $messageDiv = $('#registrationMessage');
        
        // Validation
        if (!username || !email || !password || !confirmPassword) {
            $messageDiv.text('Please fill in all fields').removeClass('d-none alert-success').addClass('alert-danger');
            return;
        }
        
        if (password !== confirmPassword) {
            $messageDiv.text('Passwords do not match').removeClass('d-none alert-success').addClass('alert-danger');
            return;
        }
        
        if (password.length < 6) {
            $messageDiv.text('Password must be at least 6 characters long').removeClass('d-none alert-success').addClass('alert-danger');
            return;
        }
        
        // Show loading
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.html();
        $submitBtn.html('<span class="spinner-border spinner-border-sm me-2"></span>Creating account...').prop('disabled', true);
        
        try {
            const result = await window.Auth.register(username, email, password);
            
            if (result.success) {
                $messageDiv.text('Registration successful! You can now log in.')
                          .removeClass('d-none alert-danger')
                          .addClass('alert-success');
                
                setTimeout(() => {
                    // Use smart redirect for registration too
                    window.location.href = window.getPageUrl('login.html');
                }, 2000);
            } else {
                $messageDiv.text(result.error)
                          .removeClass('d-none alert-success')
                          .addClass('alert-danger');
            }
        } catch (error) {
            $messageDiv.text('An error occurred. Please try again.')
                      .removeClass('d-none alert-success')
                      .addClass('alert-danger');
        } finally {
            $submitBtn.html(originalText).prop('disabled', false);
        }
    });
});

// Global function to open community share modal with article data
window.openCommunityShareModal = function(article) {
    // Check if user is logged in
    const userId = localStorage.getItem('userId');
    if (!userId) {
        if (typeof showAlert === 'function') {
            showAlert('warning', 'Please log in to share with the community');
        }
        return;
    }

    // Create the community share modal if it doesn't exist
    if (!document.getElementById('shareModal')) {
        const modalHtml = `
            <div class="modal fade" id="shareModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-share me-2"></i>Share Article with Community
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">                    
                            <form id="shareForm">
                                <div class="mb-3">
                                    <label for="articleUrl" class="form-label">
                                        <i class="fas fa-link me-1"></i>Article URL *
                                    </label>
                                    <input type="url" class="form-control" id="articleUrl" required>
                                </div>
                                <div class="mb-3">
                                    <label for="articleTitle" class="form-label">
                                        <i class="fas fa-heading me-1"></i>Article Title *
                                    </label>
                                    <input type="text" class="form-control" id="articleTitle" required>
                                </div>
                                <div class="mb-3">
                                    <label for="articleSource" class="form-label">
                                        <i class="fas fa-globe me-1"></i>Source
                                    </label>
                                    <input type="text" class="form-control" id="articleSource">
                                </div>
                                <div class="mb-3">
                                    <label for="articleDescription" class="form-label">
                                        <i class="fas fa-align-left me-1"></i>Description
                                    </label>
                                    <textarea class="form-control" id="articleDescription" rows="2"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="articleImage" class="form-label">
                                        <i class="fas fa-image me-1"></i>Image URL
                                    </label>
                                    <input type="url" class="form-control" id="articleImage">
                                </div>
                                <div class="mb-3">
                                    <label for="shareComment" class="form-label">
                                        <i class="fas fa-comment me-1"></i>Your Comment *
                                    </label>
                                    <textarea class="form-control" id="shareComment" rows="3" required 
                                              placeholder="Why are you sharing this article? What are your thoughts?"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label for="shareTags" class="form-label">
                                        <i class="fas fa-tags me-1"></i>Tags (comma separated)
                                    </label>
                                    <input type="text" class="form-control" id="shareTags" 
                                           placeholder="news, politics, technology, health...">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                <i class="fas fa-times me-1"></i>Cancel
                            </button>
                            <button type="button" class="btn btn-primary" id="submitShare">
                                <i class="fas fa-share me-1"></i>Share with Community
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Add submit handler
        document.getElementById('submitShare').addEventListener('click', function() {
            const formData = {
                url: document.getElementById('articleUrl').value,
                articleTitle: document.getElementById('articleTitle').value,
                articleSource: document.getElementById('articleSource').value,
                articleDescription: document.getElementById('articleDescription').value,
                articleImageUrl: document.getElementById('articleImage').value,
                comment: document.getElementById('shareComment').value,
                // Send tags as array
                tags: document.getElementById('shareTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
            };

            if (!formData.url || !formData.articleTitle || !formData.comment) {
                if (typeof showAlert === 'function') {
                    showAlert('warning', 'Please fill in all required fields');
                }
                return;
            }

            // Submit to API (using the same URL as in share.js)
            $.ajax({
                type: 'POST',
                url: `http://localhost:5121/api/shared?userId=${userId}`,
                data: JSON.stringify(formData),
                contentType: 'application/json',
                dataType: 'json',
                success: function(response) {
                    if (response && response.success) {
                        if (typeof showAlert === 'function') {
                            showAlert('success', 'Article shared with community successfully!');
                        }
                        bootstrap.Modal.getInstance(document.getElementById('shareModal')).hide();
                        
                        // Clear form
                        document.getElementById('shareForm').reset();
                    } else {
                        if (typeof showAlert === 'function') {
                            showAlert('danger', response.message || 'Failed to share article');
                        }
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Share failed:', error);
                    if (typeof showAlert === 'function') {
                        showAlert('danger', 'Failed to share article. Please try again.');
                    }
                }
            });
        });
    }

    // Pre-fill the modal with article data
    document.getElementById('articleUrl').value = article.url || '';
    document.getElementById('articleTitle').value = article.title || '';
    document.getElementById('articleSource').value = (article.source && article.source.name) || article.source || '';
    document.getElementById('articleDescription').value = article.description || article.content || '';
    document.getElementById('articleImage').value = article.urlToImage || '';
    document.getElementById('shareComment').value = '';
    // Auto-fill tags from category if available
    var category = article.category || article.Category || '';
    document.getElementById('shareTags').value = category ? category : '';

    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('shareModal'));
    modal.show();
};

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

// Make functions globally available
window.followUser = followUser;
window.unfollowUser = unfollowUser;