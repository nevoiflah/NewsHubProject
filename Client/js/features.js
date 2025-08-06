// features.js - Features Demo Page JavaScript
var FeaturesDemo = {
    // Initialize the page
    init: function() {
        this.checkSystemStatus();
        this.updateUserInterface();
    },

    // SYSTEM STATUS METHODS
    // ---------------------
    checkSystemStatus: function() {
        try {
            // Test server connectivity using direct $.ajax
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/News/latest',
                cache: false,
                dataType: "json",
                success: function(newsResponse) {
                    document.getElementById('serverStatus').innerHTML = '<i class="fas fa-check-circle text-success"></i>';
                    document.getElementById('totalNews').textContent = newsResponse && newsResponse.length ? newsResponse.length.toString() : '0';
                    
                    FeaturesDemo.updateUserStats();
                    FeaturesDemo.updateUserStatusIndicator();
                },
                error: function(xhr, status, error) {
                    console.error('System status check failed:', error);
                    document.getElementById('serverStatus').innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
                    document.getElementById('totalNews').textContent = 'Error';
                    document.getElementById('userStatus').innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
                }
            });
        } catch (error) {
            console.error('System status check failed:', error);
            document.getElementById('serverStatus').innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
            document.getElementById('totalNews').textContent = 'Error';
            document.getElementById('userStatus').innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
        }
    },

    updateUserStats: function() {
        if (Auth.isAdmin()) {
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/stats',
                cache: false,
                dataType: "json",
                success: function(statsResponse) {
                    document.getElementById('totalUsers').textContent = statsResponse && statsResponse.totalUsers ? statsResponse.totalUsers.toString() : '0';
                },
                error: function() {
                    document.getElementById('totalUsers').textContent = 'N/A';
                }
            });
        } else {
            document.getElementById('totalUsers').textContent = 'N/A';
        }
    },

    updateUserStatusIndicator: function() {
        if (Auth.isLoggedIn()) {
            document.getElementById('userStatus').innerHTML = '<i class="fas fa-user-check text-success"></i>';
        } else {
            document.getElementById('userStatus').innerHTML = '<i class="fas fa-user-times text-warning"></i>';
        }
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
    testNews: function() {
        showAlert('info', 'Testing news feed...', 2000);
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/News/latest',
            cache: false,
            dataType: "json",
            success: function(response) {
                if (response && response.length > 0) {
                    showAlert('success', '✅ News feed working! Found ' + response.length + ' articles');
                } else {
                    showAlert('warning', 'News feed connected but no articles found');
                }
            },
            error: function() {
                showAlert('danger', 'Failed to connect to news feed');
            }
        });
    },

    checkCategories: function() {
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/News/latest',
            cache: false,
            dataType: "json",
            success: function(response) {
                if (response && response.length > 0) {
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
                    
                    showAlert('info', 'Available categories: ' + categories.join(', '), 5000);
                }
            },
            error: function() {
                showAlert('danger', 'Failed to load categories');
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