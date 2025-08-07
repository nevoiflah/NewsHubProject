// features.js - Features Demo Page JavaScript
var FeaturesDemo = {
    // Initialize the page
    init: function() {
        this.checkSystemStatus();
        this.updateUserInterface();
        this.startRealTimeUpdates(); // Start real-time updates
    },

    // SYSTEM STATUS METHODS
    // ---------------------
    checkSystemStatus: function() {
        try {
            FeaturesDemo.updateUserStats();
        } catch (error) {
            console.error('System status check failed:', error);
        }
    },

    updateUserStats: function() {
        // Get user count
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/Users/GetAllUsers',
            cache: false,
            dataType: "json",
            success: function(usersResponse) {
                document.getElementById('totalUsers').textContent = usersResponse && usersResponse.length ? usersResponse.length.toString() : '0';
            },
            error: function() {
                document.getElementById('totalUsers').textContent = 'N/A';
            }
        });
        
        // Get article count with real-time updates
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/News/latest',
            cache: false,
            dataType: "json",
            success: function(articlesResponse) {
                var articleCount = articlesResponse && articlesResponse.length ? articlesResponse.length.toString() : '0';
                document.getElementById('totalArticles').textContent = articleCount;
                console.log('📊 Real-time article count updated:', articleCount);
            },
            error: function(xhr, status, error) {
                document.getElementById('totalArticles').textContent = 'N/A';
                console.error('❌ Failed to get article count:', error);
            }
        });
    },

    // Real-time updates every 30 seconds
    startRealTimeUpdates: function() {
        setInterval(function() {
            FeaturesDemo.updateUserStats();
        }, 30000); // Update every 30 seconds
    },



    // UI UPDATE METHODS
    // ----------------
    updateUserInterface: function() {
        var isLoggedIn = Auth.isLoggedIn();
        var isAdmin = Auth.isAdmin();
        
        this.updateCommunityActions(isLoggedIn);
        this.updateAdminActions(isLoggedIn, isAdmin);
        this.updateUserActions(isLoggedIn);
    },

    updateCommunityActions: function(isLoggedIn) {
        var communityActions = document.getElementById('communityActions');
        if (!isLoggedIn) {
            // Add login prompt
            var loginBtn = document.createElement('button');
            loginBtn.className = 'btn btn-outline-warning btn-sm ms-2';
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt me-1"></i>Login Required';
            loginBtn.onclick = function() {
                window.location.href = 'login.html';
            };
            communityActions.appendChild(loginBtn);
        }
        // If logged in, additional community features would go here
    },

    updateAdminActions: function(isLoggedIn, isAdmin) {
        var adminActions = document.getElementById('adminActions');
        if (isAdmin) {
            adminActions.innerHTML = 
                '<a href="admin.html" class="btn btn-outline-light btn-sm">' +
                    '<i class="fas fa-tachometer-alt me-1"></i>Open Dashboard' +
                '</a>' +
                '<button class="btn btn-outline-light btn-sm ms-2" onclick="FeaturesDemo.testAdmin()">' +
                    '<i class="fas fa-users me-1"></i>Test Admin API' +
                '</button>';
        } 
        else if (isLoggedIn) {
            adminActions.innerHTML = 
                '<span class="text-muted small">' +
                    '<i class="fas fa-lock me-1"></i>Admin access required' +
                '</span>';
        } 
        else {
            adminActions.innerHTML = 
                '<button class="btn btn-outline-warning btn-sm" onclick="window.location.href=\'/login.html\'">' +
                    '<i class="fas fa-sign-in-alt me-1"></i>Login to Access' +
                '</button>';
        }
    },

    updateUserActions: function(isLoggedIn) {
        var userActions = document.getElementById('userActions');
        if (isLoggedIn) {
            userActions.innerHTML = 
                '<a href="interests.html" class="btn btn-outline-light btn-sm">' +
                    '<i class="fas fa-heart me-1"></i>Manage Interests' +
                '</a>' +
                '<a href="saved.html" class="btn btn-outline-light btn-sm ms-2">' +
                    '<i class="fas fa-bookmark me-1"></i>Saved Articles' +
                '</a>';
        } else {
            userActions.innerHTML = 
                '<button class="btn btn-outline-warning btn-sm" onclick="window.location.href=\'/register.html\'">' +
                    '<i class="fas fa-user-plus me-1"></i>Create Account' +
                '</button>';
        }
    },

    // NEWS & CATEGORY METHODS
    // ----------------------
    toggleCategories: function() {
        var categoriesDisplay = document.getElementById('categoriesDisplay');
        var button = event.target.closest('button');
        
        if (categoriesDisplay.style.display === 'none') {
            // Show categories
            categoriesDisplay.style.display = 'block';
            button.innerHTML = '<i class="fas fa-eye-slash me-1"></i>Hide Categories';
            button.classList.remove('btn-outline-light');
            button.classList.add('btn-light', 'text-dark');
            
            // Load categories
            this.loadCategories();
        } else {
            // Hide categories
            categoriesDisplay.style.display = 'none';
            button.innerHTML = '<i class="fas fa-list me-1"></i>View Categories';
            button.classList.remove('btn-light', 'text-dark');
            button.classList.add('btn-outline-light');
        }
    },

    loadCategories: function() {
        var categoriesList = document.getElementById('categoriesList');
        categoriesList.innerHTML = '<div class="text-muted">Loading categories...</div>';
        
        console.log('🔍 Attempting to load categories from API...');
        
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/News/latest',
            cache: false,
            dataType: "json",
            success: function(response) {
                console.log('✅ API Response received:', response);
                
                if (response && response.length > 0) {
                    console.log('📊 Found', response.length, 'articles');
                    
                    var categories = [];
                    var categorySet = {};
                    
                    // Extract unique categories
                    for (var i = 0; i < response.length; i++) {
                        var category = response[i].category || 'general';
                        if (!categorySet[category]) {
                            categorySet[category] = true;
                            categories.push(category);
                        }
                    }
                    
                    console.log('🏷️ Unique categories found:', categories);
                    
                    // Count articles per category
                    var categoryCounts = {};
                    response.forEach(function(article) {
                        var category = article.category || 'general';
                        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                    });
                    
                    console.log('📈 Category counts:', categoryCounts);
                    
                    // Display categories as list with counts
                    var categoriesHtml = '';
                    categories.forEach(function(category) {
                        var count = categoryCounts[category] || 0;
                        categoriesHtml += '<div class="mb-1">' + category + ' (' + count + ')</div>';
                    });
                    
                    categoriesList.innerHTML = categoriesHtml || '<div class="text-muted">No categories found</div>';
                } else {
                    console.log('⚠️ No articles found in response');
                    categoriesList.innerHTML = '<div class="text-muted">No categories found</div>';
                }
            },
            error: function(xhr, status, error) {
                console.error('❌ API Error:', xhr.status, status, error);
                console.error('❌ Response Text:', xhr.responseText);
                
                var errorMessage = 'Failed to load categories';
                if (xhr.status === 0) {
                    errorMessage = 'Server not running. Please start your C# server.';
                } else if (xhr.status === 404) {
                    errorMessage = 'API endpoint not found. Check server configuration.';
                } else if (xhr.status === 500) {
                    errorMessage = 'Server error. Check server logs.';
                }
                
                categoriesList.innerHTML = '<div class="text-danger">' + errorMessage + '</div>';
            }
        });
    },

    // NOTIFICATION METHODS
    // -------------------
    testNotification: function() {
        if (!window.NotificationService) {
            showAlert('warning', 'Notification service not available');
            return;
        }
        
        if (Notification.permission === 'granted') {
            window.NotificationService.showInAppNotification(
                '🧪 Test Notification',
                'Your notification system is working perfectly!',
                'success'
            );
            showAlert('success', 'Test notification sent!');
        } else if (Notification.permission === 'default') {
            showAlert('info', 'Please enable notifications first');
        } else {
            showAlert('warning', 'Notifications are disabled in your browser');
        }
    },

    checkPermission: function() {
        var permission = Notification.permission;
        var message, type;
        
        switch (permission) {
            case 'granted':
                message = '✅ Notifications enabled';
                type = 'success';
                break;
            case 'denied':
                message = '❌ Notifications blocked';
                type = 'danger';
                break;
            case 'default':
                message = '⚠️ Permission not requested';
                type = 'warning';
                break;
            default:
                message = 'Unknown status';
                type = 'info';
        }
        
        showAlert(type, message);
    },

    // FEATURE TEST METHODS
    // -------------------
    testCommunity: function() {
        if (!Auth.isLoggedIn()) {
            showAlert('warning', 'Please log in to test community features');
            return;
        }
        
        showAlert('info', 'Community features are active! Check the Community page for sharing and social features.', 3000);
    },

    testAdmin: function() {
        if (!Auth.isAdmin()) {
            showAlert('warning', 'Admin access required');
            return;
        }
        
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/Admin/stats',
            cache: false,
            dataType: "json",
            success: function(response) {
                showAlert('success', '✅ Admin API working! Found ' + (response.totalUsers || 0) + ' users');
            },
            error: function() {
                showAlert('danger', 'Failed to connect to admin API');
            }
        });
    },

    testMapping: function() {
        showAlert('info', 'Geographic mapping uses Leaflet.js with real-time news data. Check the News Map page!', 3000);
    },

    testAI: function() {
        showAlert('info', 'AI features include sentiment analysis and category detection. Look for sentiment badges on news articles!', 4000);
    },

    showSentiment: function() {
        var sentiments = ['😊 Positive', '😐 Neutral', '😞 Negative'];
        var randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        showAlert('info', 'Example sentiment: ' + randomSentiment, 2000);
    },

    // BACKEND CONNECTIVITY METHODS
    // --------------------------
    testBackend: function() {
        var apiStatus = document.getElementById('apiStatus');
        apiStatus.innerHTML = '<div class="text-warning"><i class="fas fa-spinner fa-spin me-2"></i>Testing API endpoints...</div>';
        
        var endpoints = [
            { name: 'News API', url: 'http://localhost:5121/api/News/latest' },
            { name: 'Users API', url: 'http://localhost:5121/api/Users/GetAllUsers' }
        ];
        
        var results = [];
        var completedRequests = 0;
        
        function checkCompletion() {
            completedRequests++;
            if (completedRequests === endpoints.length) {
                apiStatus.innerHTML = '<div class="small">' + results.join('<br>') + '</div>';
            }
        }
        
        for (var i = 0; i < endpoints.length; i++) {
            var endpoint = endpoints[i];
            
            $.ajax({
                type: 'GET',
                url: endpoint.url,
                cache: false,
                dataType: "json",
                success: function(data, textStatus, xhr) {
                    var endpointName = xhr.responseURL.includes('News') ? 'News API' : 'Users API';
                    results.push('✅ ' + endpointName + ': Connected');
                    checkCompletion();
                },
                error: function(xhr, status, error) {
                    var endpointName = xhr.responseURL && xhr.responseURL.includes('News') ? 'News API' : 'Users API';
                    results.push('❌ ' + endpointName + ': Failed');
                    checkCompletion();
                }
            });
        }
    },

    checkDatabase: function() {
        showAlert('info', 'Database: SQL Server with stored procedures. Connection tested via API endpoints.', 3000);
    },

    testFirebase: function() {
        if (window.firebase && window.firebase.app) {
            showAlert('success', '✅ Firebase connected and ready!');
        } else {
            showAlert('warning', 'Firebase not initialized. Check console for details.');
        }
    }
};

// Initialize when page loads
$(document).ready(function() {
    FeaturesDemo.init();
});