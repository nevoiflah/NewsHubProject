// savedNews.js - Production Ready Version with Grid/List Toggle
var SavedNewsManager = {
    savedArticles: [],
    filteredArticles: [],
    currentSort: 'saved_date',
    currentCategory: '',
    currentSearch: '',
    currentView: 'grid', // Add view toggle property

    // Initialize saved news page
    init: function() {
        console.log('🚀 Initializing SavedNewsManager...');
        SavedNewsManager.setupEventListeners();
        SavedNewsManager.loadSavedArticles();
    },

    // Setup event listeners
    setupEventListeners: function() {
        $('#searchBtn').on('click', SavedNewsManager.handleSearch);
        $('#searchSaved').on('keypress', function(e) {
            if (e.which === 13) { // Enter key
                SavedNewsManager.handleSearch();
            }
        });

        $('#sortBy').on('change', SavedNewsManager.handleSortChange);
        $('#filterCategory').on('change', SavedNewsManager.handleCategoryChange);
        
        // Add view toggle event listeners
        $('#gridView').on('click', function() {
            SavedNewsManager.switchView('grid');
        });
        $('#listView').on('click', function() {
            SavedNewsManager.switchView('list');
        });
    },

    // Switch between grid and list view
    switchView: function(view) {
        SavedNewsManager.currentView = view;
        
        // Update button states
        if (view === 'grid') {
            $('#gridView')
                .addClass('btn-primary active')
                .removeClass('btn-outline-primary');
            $('#listView')
                .addClass('btn-outline-primary')
                .removeClass('btn-primary active');
        } else {
            $('#listView')
                .addClass('btn-primary active')
                .removeClass('btn-outline-primary');
            $('#gridView')
                .addClass('btn-outline-primary')
                .removeClass('btn-primary active');
        }

        // Redisplay articles with new view
        SavedNewsManager.displayArticles();
    },

    // Show login required message (for non-authenticated users)
    showLoginRequiredMessage: function() {
        $('#savedArticles').hide();
        var noArticlesDiv = $('#noArticles');
        
        noArticlesDiv.html(`
            <div class="text-center py-5">
                <i class="fas fa-lock fa-3x text-warning mb-3"></i>
                <h5 class="text-muted">Authentication Required</h5>
                <p class="text-muted">Please log in to view your saved articles.</p>
                <a href="login.html" class="btn btn-primary">
                    <i class="fas fa-sign-in-alt me-2"></i>Log In
                </a>
            </div>
        `);
        
        noArticlesDiv.show();
        $('#articleCount').text('Login required');
    },

    // Load saved articles from API - Production version with improved debugging
    loadSavedArticles: function () {
        console.log('🔄 Loading saved articles...');

        const userId = localStorage.getItem('userId');
        console.log('👤 UserId from localStorage:', userId);

        if (!userId) {
            console.log('❌ No userId found, showing login required message');
            SavedNewsManager.showLoginRequiredMessage();
            return;
        }

        // ✅ FIXED: Use capital 'N' in News to match controller route
        const apiUrl = `http://localhost:5121/api/News/saved?userId=${userId}`;
        console.log('🌐 API URL:', apiUrl);

        $.ajax({
            type: 'GET',
            url: apiUrl,
            cache: false,
            dataType: "json",
            timeout: 10000, // 10 second timeout
            success: function (response) {
                console.log('✅ Raw API response:', response);
                console.log('📊 Response type:', typeof response);
                console.log('📊 Response structure:', Object.keys(response || {}));

                let articles = [];

                // ✅ IMPROVED: Better response parsing to handle updated controller format
                if (Array.isArray(response)) {
                    // Direct array response
                    articles = response;
                    console.log('📰 Parsed as direct array:', articles.length, 'articles');
                } else if (response && response.articles) {
                    // Object with articles property (new controller format)
                    articles = Array.isArray(response.articles) ? response.articles : [];
                    console.log('📰 Parsed from response.articles:', articles.length, 'articles');
                    console.log('📊 Response success:', response.success);
                    console.log('📊 Response message:', response.message);
                } else if (response && response.success === false) {
                    // Error response from server
                    console.log('❌ Server returned error:', response.message);
                    articles = [];
                } else {
                    // Unknown format
                    console.log('⚠️ Unknown response format, defaulting to empty array');
                    articles = [];
                }

                // ✅ IMPROVED: Log individual articles for debugging
                console.log('📋 Final articles array:', articles);
                if (articles.length > 0) {
                    console.log('📄 First article sample:', articles[0]);
                    console.log('🆔 Article ID fields check:', {
                        id: articles[0].id,
                        Id: articles[0].Id,
                        newsId: articles[0].newsId
                    });
                }

                SavedNewsManager.savedArticles = articles;
                SavedNewsManager.filteredArticles = articles.slice();

                if (articles.length > 0) {
                    console.log('🎉 Displaying articles...');
                    SavedNewsManager.displayArticles();
                    SavedNewsManager.updateArticleCount();
                } else {
                    console.log('📭 No articles found, showing empty message');
                    SavedNewsManager.showNoArticlesMessage();
                }
            },
            error: function (xhr, status, error) {
                console.error('❌ AJAX Error details:', {
                    status: xhr.status,
                    statusText: xhr.statusText,
                    error: error,
                    responseText: xhr.responseText,
                    readyState: xhr.readyState,
                    timeout: status === 'timeout'
                });

                // ✅ IMPROVED: Better error handling
                if (xhr.status === 0) {
                    console.error('🔌 Network error - server might be down');
                    SavedNewsManager.showServerConnectionError();
                } else if (xhr.status === 401 || xhr.status === 403) {
                    console.error('🚫 Authentication error');
                    SavedNewsManager.showLoginRequiredMessage();
                } else if (xhr.status === 500) {
                    console.error('💥 Server error');
                    SavedNewsManager.showServerError(xhr.responseText);
                } else {
                    console.error('❓ Unknown error');
                    SavedNewsManager.showNoArticlesMessage();
                }

                if (typeof showAlert === 'function') {
                    showAlert('danger', `Failed to load saved articles (${xhr.status})`);
                }
            }
        });
    },

    // Display articles in the UI with grid/list toggle
    displayArticles: function() {
        console.log('🎨 Displaying articles:', SavedNewsManager.filteredArticles.length);
        
        var container = $('#savedArticles');
        var noArticlesDiv = $('#noArticles');

        if (!SavedNewsManager.filteredArticles || SavedNewsManager.filteredArticles.length === 0) {
            SavedNewsManager.showNoArticlesMessage();
            return;
        }

        noArticlesDiv.hide();
        container.show();

        var html = SavedNewsManager.filteredArticles.map(function(article, index) {
            console.log(`🔍 Processing article ${index}:`, {
                title: article.title,
                id: article.id,
                Id: article.Id,
                newsId: article.newsId
            });

            // ✅ IMPROVED: Better ID handling - try multiple possible ID fields
            var articleId = article.id || article.Id || article.newsId || index;
            
            // Use fallbacks for missing properties
            var imageUrl = article.urlToImage || article.imageUrl || article.UrlToImage || '/assets/default-news.jpg';
            var source = article.source || article.Source || 'Unknown Source';
            var category = article.category || article.Category || 'General';
            var description = article.description || article.content || article.Content || 'No description available';
            var url = article.url || article.Url || '#';
            var title = article.title || article.Title || 'No title';
            
            // Safe HTML sanitization - use Utils if available, otherwise use jQuery fallback
            var sanitizeHtml = function(text) {
                if (!text) return '';
                if (window.Utils && window.Utils.sanitizeHtml) {
                    return window.Utils.sanitizeHtml(text);
                }
                // Fallback using jQuery
                return $('<div>').text(text).html();
            };
            
            // Safe text truncation
            var truncateText = function(text, maxLength) {
                if (!text) return '';
                if (window.Utils && window.Utils.truncateText) {
                    return window.Utils.truncateText(text, maxLength);
                }
                // Fallback
                if (text.length <= maxLength) return text;
                return text.substring(0, maxLength).trim() + '...';
            };

            var sanitizedTitle = sanitizeHtml(title);
            var sanitizedCategory = sanitizeHtml(category);
            var sanitizedSource = sanitizeHtml(source);

            // Format dates - handle multiple possible date field names
            var savedDate = SavedNewsManager.formatDate(
                article.savedAt || article.SavedAt || article.publishedAt || article.PublishedAt
            );
            var publishedDate = SavedNewsManager.formatDate(
                article.publishedAt || article.PublishedAt
            );

            // Grid view - better space utilization
            if (SavedNewsManager.currentView === 'grid') {
                var truncatedDescription = truncateText(description, 120);
                return `
                    <div class="col-xl-4 col-lg-4 col-md-4 mb-4">
                        <div class="card h-100 saved-article-card" data-article-id="${articleId}">
                            <img src="${imageUrl}" class="card-img-top" 
                                 style="height: 200px; object-fit: cover;" alt="Article Image"
                                 onerror="this.src='/assets/default-news.jpg'">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span class="badge bg-primary">${sanitizedCategory}</span>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li>
                                                <a class="dropdown-item" href="${url}" target="_blank">
                                                    <i class="fas fa-external-link-alt me-2"></i>Read Original
                                                </a>
                                            </li>
                                            <li>
                                                <button class="dropdown-item" onclick="SavedNewsManager.shareArticle(${articleId})">
                                                    <i class="fas fa-share me-2"></i>Share
                                                </button>
                                            </li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li>
                                                <button class="dropdown-item text-danger" onclick="SavedNewsManager.removeArticle(${articleId})">
                                                    <i class="fas fa-trash me-2"></i>Remove
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                                
                                <h6 class="card-title">
                                    <a href="${url}" target="_blank" class="text-decoration-none">
                                        ${sanitizedTitle}
                                    </a>
                                </h6>
                                
                                <p class="card-text flex-grow-1">
                                    ${truncatedDescription}
                                </p>
                                
                                <div class="mt-auto">
                                    <small class="text-muted d-block">
                                        <i class="fas fa-globe me-1"></i>${sanitizedSource}
                                    </small>
                                    <small class="text-muted d-block">
                                        <i class="fas fa-calendar me-1"></i>Published: ${publishedDate}
                                    </small>
                                    <small class="text-success d-block">
                                        <i class="fas fa-bookmark me-1"></i>Saved: ${savedDate}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // List view - full width cards
                var truncatedDescription = truncateText(description, 200);
                return `
                    <div class="col-12 mb-3">
                        <div class="card saved-article-card" data-article-id="${articleId}">
                            <div class="row g-0">
                                <div class="col-md-3">
                                    <img src="${imageUrl}" class="img-fluid rounded-start h-100" 
                                         style="object-fit: cover; min-height: 150px;" alt="Article Image"
                                         onerror="this.src='/assets/default-news.jpg'">
                                </div>
                                <div class="col-md-9">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <span class="badge bg-primary me-2">${sanitizedCategory}</span>
                                            </div>
                                            <div class="dropdown">
                                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                                        data-bs-toggle="dropdown">
                                                    <i class="fas fa-ellipsis-h"></i>
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li>
                                                        <a class="dropdown-item" href="${url}" target="_blank">
                                                            <i class="fas fa-external-link-alt me-2"></i>Read Original
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <button class="dropdown-item" onclick="SavedNewsManager.shareArticle(${articleId})">
                                                            <i class="fas fa-share me-2"></i>Share
                                                        </button>
                                                    </li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li>
                                                        <button class="dropdown-item text-danger" onclick="SavedNewsManager.removeArticle(${articleId})">
                                                            <i class="fas fa-trash me-2"></i>Remove
                                                        </button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <h6 class="card-title">
                                            <a href="${url}" target="_blank" class="text-decoration-none">
                                                ${sanitizedTitle}
                                            </a>
                                        </h6>
                                        
                                        <p class="card-text">
                                            ${truncatedDescription}
                                        </p>
                                        
                                        <small class="text-muted">
                                            <i class="fas fa-globe me-1"></i>${sanitizedSource} • 
                                            <i class="fas fa-calendar me-1"></i>Published: ${publishedDate} • 
                                            <i class="fas fa-bookmark me-1"></i>Saved: ${savedDate}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        container.html(html);
        console.log('✅ Articles displayed successfully');
    },

    // Show no articles message (for authenticated users with no saved articles)
    showNoArticlesMessage: function() {
        $('#savedArticles').hide();
        var noArticlesDiv = $('#noArticles');
        
        if (SavedNewsManager.currentSearch || SavedNewsManager.currentCategory) {
            noArticlesDiv.html(`
                <div class="text-center py-5">
                    <i class="fas fa-search fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No articles found</h5>
                    <p class="text-muted">Try adjusting your search criteria or filters.</p>
                    <button class="btn btn-outline-primary" onclick="SavedNewsManager.clearFilters()">
                        <i class="fas fa-times me-2"></i>Clear Filters
                    </button>
                </div>
            `);
        } else {
            noArticlesDiv.html(`
                <div class="text-center py-5">
                    <i class="fas fa-bookmark fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No saved articles yet</h5>
                    <p class="text-muted">Start saving articles from the news feed to see them here.</p>
                    <a href="news.html" class="btn btn-primary">
                        <i class="fas fa-newspaper me-2"></i>Browse News
                    </a>
                    <button class="btn btn-outline-secondary ms-2" onclick="SavedNewsManager.debugSavedArticles()">
                        <i class="fas fa-bug me-2"></i>Debug Info
                    </button>
                </div>
            `);
        }
        
        noArticlesDiv.show();
        $('#articleCount').text('0 articles');
    },

    // Show server connection error
    showServerConnectionError: function() {
        $('#savedArticles').hide();
        var noArticlesDiv = $('#noArticles');
        
        noArticlesDiv.html(`
            <div class="text-center py-5">
                <i class="fas fa-exclamation-triangle fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Server Connection Error</h5>
                <p class="text-muted">Unable to connect to the server. Please check:</p>
                <ul class="list-unstyled text-muted">
                    <li>• Your internet connection</li>
                    <li>• The server is running on localhost:5121</li>
                    <li>• Try refreshing the page</li>
                </ul>
                <button class="btn btn-primary" onclick="SavedNewsManager.loadSavedArticles()">
                    <i class="fas fa-sync-alt me-2"></i>Try Again
                </button>
                <button class="btn btn-outline-secondary ms-2" onclick="SavedNewsManager.debugSavedArticles()">
                    <i class="fas fa-bug me-2"></i>Debug Info
                </button>
            </div>
        `);
        
        noArticlesDiv.show();
        $('#articleCount').text('Connection error');
    },

    // Show server error
    showServerError: function(responseText) {
        $('#savedArticles').hide();
        var noArticlesDiv = $('#noArticles');
        
        noArticlesDiv.html(`
            <div class="text-center py-5">
                <i class="fas fa-server fa-3x text-danger mb-3"></i>
                <h5 class="text-danger">Server Error</h5>
                <p class="text-muted">The server encountered an error while loading your saved articles.</p>
                <div class="alert alert-danger mt-3">
                    <small>${responseText || 'Unknown server error'}</small>
                </div>
                <button class="btn btn-primary" onclick="SavedNewsManager.loadSavedArticles()">
                    <i class="fas fa-sync-alt me-2"></i>Try Again
                </button>
                <button class="btn btn-outline-secondary ms-2" onclick="SavedNewsManager.debugSavedArticles()">
                    <i class="fas fa-bug me-2"></i>Debug Info
                </button>
            </div>
        `);
        
        noArticlesDiv.show();
        $('#articleCount').text('Server error');
    },

    // Debug method to help troubleshoot issues
    debugSavedArticles: function() {
        const userId = localStorage.getItem('userId');
        const debugInfo = {
            userId: userId,
            currentPage: window.location.pathname,
            apiUrl: `http://localhost:5121/api/News/saved?userId=${userId}`,
            savedArticlesCount: SavedNewsManager.savedArticles.length,
            filteredArticlesCount: SavedNewsManager.filteredArticles.length,
            localStorage: {
                userInfo: localStorage.getItem('userInfo'),
                userId: userId
            }
        };

        console.log('🐛 DEBUG INFO:', debugInfo);
        
        // Test API connectivity
        if (userId) {
            console.log('🧪 Testing API connectivity...');
            $.ajax({
                type: 'GET',
                url: `http://localhost:5121/api/News/debug/user/${userId}`,
                cache: false,
                dataType: "json",
                success: function(response) {
                    console.log('✅ Debug API response:', response);
                    alert(`DEBUG INFO:\nUser ID: ${userId}\nSaved Articles in DB: ${response.savedCount}\nAPI Response: ${JSON.stringify(response, null, 2)}`);
                },
                error: function(xhr) {
                    console.log('❌ Debug API failed:', xhr);
                    alert(`DEBUG INFO:\nUser ID: ${userId}\nAPI Test Failed: ${xhr.status} ${xhr.statusText}\nResponse: ${xhr.responseText}`);
                }
            });
        } else {
            alert('DEBUG INFO:\nNo user ID found in localStorage\nPlease log in first');
        }
    },

    // Handle search
    handleSearch: function() {
        var searchTerm = $('#searchSaved').val().trim();
        SavedNewsManager.currentSearch = searchTerm.toLowerCase();
        SavedNewsManager.applyFilters();
    },

    // Handle sort change
    handleSortChange: function() {
        SavedNewsManager.currentSort = $('#sortBy').val();
        SavedNewsManager.applyFilters();
    },

    // Handle category filter change
    handleCategoryChange: function() {
        SavedNewsManager.currentCategory = $('#filterCategory').val();
        SavedNewsManager.applyFilters();
    },

    // Apply all filters and sorting
    applyFilters: function() {
        SavedNewsManager.filteredArticles = SavedNewsManager.savedArticles.slice();

        // Apply search filter
        if (SavedNewsManager.currentSearch) {
            SavedNewsManager.filteredArticles = SavedNewsManager.filteredArticles.filter(function(article) {
                const title = (article.title || article.Title || '').toLowerCase();
                const description = (article.description || article.content || article.Content || '').toLowerCase();
                const source = (article.source || article.Source || '').toLowerCase();
                
                return title.includes(SavedNewsManager.currentSearch) ||
                       description.includes(SavedNewsManager.currentSearch) ||
                       source.includes(SavedNewsManager.currentSearch);
            });
        }

        // Apply category filter
        if (SavedNewsManager.currentCategory) {
            SavedNewsManager.filteredArticles = SavedNewsManager.filteredArticles.filter(function(article) {
                return (article.category || article.Category || 'general') === SavedNewsManager.currentCategory;
            });
        }

        // Apply sorting
        SavedNewsManager.filteredArticles.sort(function(a, b) {
            switch (SavedNewsManager.currentSort) {
                case 'title':
                    return (a.title || a.Title || '').localeCompare(b.title || b.Title || '');
                case 'source':
                    return (a.source || a.Source || '').localeCompare(b.source || b.Source || '');
                case 'published_date':
                    return new Date(b.publishedAt || b.PublishedAt || 0) - new Date(a.publishedAt || a.PublishedAt || 0);
                case 'saved_date':
                default:
                    return new Date(b.savedAt || b.SavedAt || b.publishedAt || b.PublishedAt || 0) - 
                           new Date(a.savedAt || a.SavedAt || a.publishedAt || a.PublishedAt || 0);
            }
        });

        SavedNewsManager.displayArticles();
        SavedNewsManager.updateArticleCount();
    },

    // Clear all filters
    clearFilters: function() {
        $('#searchSaved').val('');
        $('#filterCategory').val('');
        $('#sortBy').val('saved_date');
        
        SavedNewsManager.currentSearch = '';
        SavedNewsManager.currentCategory = '';
        SavedNewsManager.currentSort = 'saved_date';
        
        SavedNewsManager.applyFilters();
        if (typeof showAlert === 'function') {
            showAlert('info', 'Filters cleared');
        }
    },

    // Update article count display
    updateArticleCount: function() {
        var totalCount = SavedNewsManager.savedArticles.length;
        var filteredCount = SavedNewsManager.filteredArticles.length;
        
        var countText = '';
        if (SavedNewsManager.currentSearch || SavedNewsManager.currentCategory) {
            countText = `Showing ${filteredCount} of ${totalCount} saved articles`;
        } else {
            countText = `${totalCount} saved articles`;
        }
        
        $('#articleCount').text(countText);
    },

    // Remove article - Production version (requires authentication)
    removeArticle: function(articleId) {
        if (!confirm('Are you sure you want to remove this article from your saved list?')) {
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            if (typeof showAlert === 'function') {
                showAlert('warning', 'Please log in to remove articles');
            }
            return;
        }

        console.log('🗑️ Removing article:', articleId, 'for user:', userId);

        $.ajax({
            type: 'DELETE',
            url: `http://localhost:5121/api/News/saved/${articleId}?userId=${userId}`, // ✅ Fixed URL case
            cache: false,
            success: function (response) {
                console.log('✅ Article removed:', response);

                if (response && (response.success === true || response.success === undefined)) {
                    SavedNewsManager.savedArticles = SavedNewsManager.savedArticles.filter(function (article) {
                        return (article.id || article.Id || article.newsId) !== articleId;
                    });

                    SavedNewsManager.applyFilters();

                    if (typeof showAlert === 'function') {
                        showAlert('success', response.message || 'Article removed from saved list');
                    }
                } else {
                    if (typeof showAlert === 'function') {
                        showAlert('danger', response.message || 'Failed to remove article');
                    }
                }
            },
            error: function (xhr, status, error) {
                console.error('❌ Error removing article:', error);
                if (typeof showAlert === 'function') {
                    showAlert('danger', 'Error removing article');
                }
            }
        });
    },

    // Share article
    shareArticle: function(articleId) {
        // Find the article by ID
        var article = SavedNewsManager.savedArticles.find(function(a) {
            return (a.id || a.Id || a.newsId) === articleId;
        });
        
        if (!article) {
            console.error('Article not found:', articleId);
            return;
        }
    
        // Use community share modal instead of native sharing
        if (typeof window.openCommunityShareModal === 'function') {
            window.openCommunityShareModal(article);
        } else {
            // Fallback to original sharing
            if (navigator.share) {
                navigator.share({
                    title: article.title || article.Title,
                    text: article.content || article.Content,
                    url: article.url || article.Url
                }).then(function() {
                    if (typeof showAlert === 'function') {
                        showAlert('success', 'Article shared successfully');
                    }
                }).catch(function(error) {
                    console.log('Error sharing:', error);
                    SavedNewsManager.fallbackShare(article);
                });
            } else {
                SavedNewsManager.fallbackShare(article);
            }
        }
    },

    // Fallback share method
    fallbackShare: function(article) {
        var url = article.url || article.Url;
        // Copy URL to clipboard
        if (navigator.clipboard && url) {
            navigator.clipboard.writeText(url).then(function() {
                if (typeof showAlert === 'function') {
                    showAlert('success', 'Article URL copied to clipboard');
                }
            }).catch(function() {
                SavedNewsManager.showShareModal(article);
            });
        } else {
            SavedNewsManager.showShareModal(article);
        }
    },

    // Show share modal
    showShareModal: function(article) {
        var shareText = `${article.title || article.Title}\n\n${article.description || article.content || article.Content || ''}\n\nRead more: ${article.url || article.Url}`;
        
        var modal = `
            <div class="modal fade" id="shareModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Share Article</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <textarea class="form-control" rows="6" readonly>${shareText}</textarea>
                            <div class="mt-3 d-grid gap-2 d-md-flex justify-content-md-end">
                                <button class="btn btn-outline-primary" onclick="SavedNewsManager.copyShareText('${article.url || article.Url}')">
                                    <i class="fas fa-copy me-2"></i>Copy URL
                                </button>
                                <a href="mailto:?subject=${encodeURIComponent(article.title || article.Title)}&body=${encodeURIComponent(shareText)}" 
                                   class="btn btn-outline-secondary">
                                    <i class="fas fa-envelope me-2"></i>Email
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modal);
        var shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
        shareModal.show();
        
        // Remove modal when hidden
        $('#shareModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
    },

    // Copy share text to clipboard
    copyShareText: function(url) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(url).then(function() {
                if (typeof showAlert === 'function') {
                    showAlert('success', 'URL copied to clipboard');
                }
                $('#shareModal').modal('hide');
            });
        }
    },

    // Format date for display
    formatDate: function(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            var date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            var now = new Date();
            var diffMs = now - date;
            var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) {
                return 'Today';
            } else if (diffDays === 1) {
                return 'Yesterday';
            } else if (diffDays < 7) {
                return `${diffDays} days ago`;
            } else {
                return date.toLocaleDateString();
            }
        } catch (error) {
            return 'Invalid date';
        }
    },

    // Export saved articles
    exportSavedArticles: function() {
        if (SavedNewsManager.savedArticles.length === 0) {
            if (typeof showAlert === 'function') {
                showAlert('info', 'No saved articles to export');
            }
            return;
        }

        try {
            var exportData = SavedNewsManager.savedArticles.map(function(article) {
                return {
                    title: article.title || article.Title,
                    description: article.description || article.content || article.Content,
                    url: article.url || article.Url,
                    source: article.source || article.Source,
                    publishedAt: article.publishedAt || article.PublishedAt,
                    savedAt: article.savedAt || article.SavedAt
                };
            });

            var dataStr = JSON.stringify(exportData, null, 2);
            var dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            var exportFileDefaultName = 'saved-articles-' + new Date().toISOString().split('T')[0] + '.json';
            
            var linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            if (typeof showAlert === 'function') {
                showAlert('success', 'Saved articles exported successfully');
            }
        } catch (error) {
            console.error('Error exporting articles:', error);
            if (typeof showAlert === 'function') {
                showAlert('danger', 'Failed to export articles');
            }
        }
    },

    // Clear all saved articles - Production version
    clearAllSavedArticles: function() {
        if (SavedNewsManager.savedArticles.length === 0) {
            if (typeof showAlert === 'function') {
                showAlert('info', 'No saved articles to clear');
            }
            return;
        }

        const confirmed = confirm('Are you sure you want to remove all saved articles?');

        if (!confirmed) return;

        const userId = localStorage.getItem('userId');
        if (!userId) {
            if (typeof showAlert === 'function') {
                showAlert('warning', 'Please log in to clear articles');
            }
            return;
        }

        const promises = SavedNewsManager.savedArticles.map(article =>
            $.ajax({
                type: 'DELETE',
                url: `http://localhost:5121/api/News/saved/${article.id || article.Id || article.newsId}?userId=${userId}`, // ✅ Fixed URL case
                cache: false
            })
        );

        $.when.apply($, promises).done(function () {
            SavedNewsManager.savedArticles = [];
            SavedNewsManager.filteredArticles = [];
            SavedNewsManager.showNoArticlesMessage();

            if (typeof showAlert === 'function') {
                showAlert('success', 'All saved articles have been removed');
            }
        }).fail(function () {
            if (typeof showAlert === 'function') {
                showAlert('danger', 'Failed to clear saved articles');
            }
        });
    }
}

// Initialize saved news manager when page loads
$(document).ready(function() {
    if (window.location.pathname.indexOf('saved.html') !== -1 || window.location.href.indexOf('saved.html') !== -1) {
        SavedNewsManager.init();
    }
});