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
        ajaxCall(
            'GET',
            'http://localhost:5121/api/Users/GetAllUsers',
            null,
            function(usersResponse) {
                document.getElementById('totalUsers').textContent = usersResponse && usersResponse.length ? usersResponse.length.toString() : '0';
            },
            function() {
                document.getElementById('totalUsers').textContent = 'N/A';
            }
        );
        
        // Get article count using the same logic as news page
        FeaturesDemo.fetchRealArticles().then(function(articles) {
            var articleCount = articles && articles.length ? articles.length.toString() : '0';
            document.getElementById('totalArticles').textContent = articleCount;
            console.log('📊 Real-time article count updated:', articleCount);
            
            // Store articles for categories
            FeaturesDemo.allArticlesData = articles;
        }).catch(function(error) {
            document.getElementById('totalArticles').textContent = 'N/A';
            console.error('❌ Failed to get article count:', error);
        });
    },

    // Fetch real articles from NewsAPI (same as news page)
    fetchRealArticles: async function() {
        const API_KEY = '1c92222d21a84a7ab30168a35d967b22';
        
        // Try multiple endpoints to get ~100 articles
        const endpoints = [
            `https://newsapi.org/v2/everything?q=health&language=en&sortBy=publishedAt&pageSize=100&apiKey=${API_KEY}`,
            `https://newsapi.org/v2/top-headlines?country=us&language=en&pageSize=100&apiKey=${API_KEY}`,
            `https://newsapi.org/v2/everything?q=technology&language=en&sortBy=popularity&pageSize=50&apiKey=${API_KEY}`,
            `https://newsapi.org/v2/everything?q=business&language=en&sortBy=popularity&pageSize=50&apiKey=${API_KEY}`
        ];

        let allArticles = [];
        
        for (let endpoint of endpoints) {
            try {
                console.log('🔍 Trying NewsAPI endpoint...');
                const response = await $.ajax({
                    url: endpoint,
                    method: 'GET',
                    dataType: 'json',
                    timeout: 10000
                });

                if (response.status === 'ok' && response.articles) {
                    const validArticles = response.articles.filter(article => 
                        article.title && 
                        article.title !== '[Removed]' && 
                        article.description &&
                        article.description !== '[Removed]' &&
                        article.title.trim().length > 0
                    );
                    
                    // Add to collection, avoiding duplicates
                    validArticles.forEach(article => {
                        const exists = allArticles.some(existing => existing.url === article.url);
                        if (!exists) {
                            allArticles.push(article);
                        }
                    });
                }
            } catch (error) {
                console.error('❌ NewsAPI endpoint failed:', error);
            }
        }
        
        // Enrich articles with categories (same as news page)
        const enrichedArticles = allArticles.map(article => {
            return {
                ...article,
                category: FeaturesDemo.detectCategory(article),
                source: article.source || { name: 'Unknown' }
            };
        });
        
        // Limit to 100 articles
        return enrichedArticles.slice(0, 100);
    },

    // Detect article category (same as news page)
    detectCategory: function(article) {
        var text = ((article.title || '') + ' ' + (article.description || '') + ' ' + ((article.source && article.source.name) || '')).toLowerCase();
        
        if (text.includes('breaking') || text.includes('urgent')) return 'breaking';
        if (text.includes('business') || text.includes('market') || text.includes('economy')) return 'business';
        if (text.includes('technology') || text.includes('tech') || text.includes('ai')) return 'technology';
        if (text.includes('health') || text.includes('medical')) return 'health';
        if (text.includes('sports') || text.includes('football')) return 'sports';
        if (text.includes('entertainment') || text.includes('celebrity')) return 'entertainment';
        if (text.includes('science') || text.includes('research')) return 'science';
        if (text.includes('politics') || text.includes('election')) return 'politics';
        
        return 'general';
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
        categoriesList.innerHTML = '<option value="">Loading categories...</option>';
        
        console.log('🔍 Loading categories from articles...');
        
        // Use the same logic as news page
        if (FeaturesDemo.allArticlesData && FeaturesDemo.allArticlesData.length > 0) {
            console.log('📊 Found', FeaturesDemo.allArticlesData.length, 'articles');
            
            var categoriesWithCount = {};
            FeaturesDemo.allArticlesData.forEach(article => {
                const category = article.category || 'general';
                categoriesWithCount[category] = (categoriesWithCount[category] || 0) + 1;
            });
            
            console.log('🏷️ Categories with counts:', categoriesWithCount);
            
            // Display categories as select options (sorted by count)
            var sortedCategories = Object.keys(categoriesWithCount).sort((a, b) => 
                categoriesWithCount[b] - categoriesWithCount[a]
            );
            
            var categoriesHtml = '<option value="">All Categories</option>';
            sortedCategories.forEach(category => {
                const count = categoriesWithCount[category];
                const displayName = FeaturesDemo.formatCategoryName(category);
                categoriesHtml += '<option value="' + category + '">' + displayName + ' (' + count + ')</option>';
            });
            
            categoriesList.innerHTML = categoriesHtml || '<option value="">No categories found</option>';
        } else {
            console.log('⚠️ No articles available, fetching fresh data...');
            
            // Fetch fresh articles if not available
            FeaturesDemo.fetchRealArticles().then(function(articles) {
                FeaturesDemo.allArticlesData = articles;
                FeaturesDemo.loadCategories(); // Recursive call with fresh data
            }).catch(function(error) {
                console.error('❌ Failed to fetch articles:', error);
                categoriesList.innerHTML = '<option value="">Failed to load categories</option>';
            });
        }
    },

    // Format category name (same as news page)
    formatCategoryName: function(category) {
        const categoryMap = {
            'general': 'General',
            'technology': 'Technology',
            'business': 'Business',
            'health': 'Health',
            'science': 'Science',
            'sports': 'Sports',
            'entertainment': 'Entertainment',
            'politics': 'Politics'
        };
        return categoryMap[category] || category.charAt(0).toUpperCase() + category.slice(1);
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
        
        ajaxCall(
            'GET',
            'http://localhost:5121/api/Admin/stats',
            null,
            function(response) {
                showAlert('success', '✅ Admin API working! Found ' + (response.totalUsers || 0) + ' users');
            },
            function() {
                showAlert('danger', 'Failed to connect to admin API');
            }
        );
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
            
            ajaxCall(
                'GET',
                endpoint.url,
                null,
                function(data, textStatus, xhr) {
                    var endpointName = xhr.responseURL.includes('News') ? 'News API' : 'Users API';
                    results.push('✅ ' + endpointName + ': Connected');
                    checkCompletion();
                },
                function(xhr, status, error) {
                    var endpointName = xhr.responseURL && xhr.responseURL.includes('News') ? 'News API' : 'Users API';
                    results.push('❌ ' + endpointName + ': Failed');
                    checkCompletion();
                }
            );
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