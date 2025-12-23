// news.js - Updated Version with 100 Real Articles and Frontend Pagination
var NewsManager = {
    currentPage: 1,
    pageSize: 20,
    displayedCount: 20,  // NEW: How many articles currently displayed
    totalPages: 1,
    hasMorePages: true,
    isLoadingMore: false,
    isLoading: false,
    currentView: 'grid',
    currentFilters: {
        category: '',
        source: '',
        search: '',
        sentiment: ''
    },
    articlesData: [],
    allArticlesData: [],
    userPreference: null,

    // SIMPLIFIED: Fast AI processing with immediate fallbacks
    HuggingFace: {
        // FAST: Single attempt sentiment analysis via Backend Proxy
        analyzeSentiment: async function (text) {
            if (!text || text.trim().length === 0) {
                return { label: 'LABEL_1', score: 0.5 };
            }

            try {
                const response = await $.ajax({
                    url: "http://localhost:5121/api/AI/sentiment",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ inputs: text.slice(0, 500) }),
                    timeout: 10000
                });

                // Backend returns the Hugging Face response directly (array)
                if (response && response[0] && response[0].label) {
                    return response[0];
                }
                throw new Error('Invalid response');
            } catch (error) {
                console.warn('Backend sentiment analysis failed, falling back to simple detection:', error);
                return NewsManager.detectSentimentSimple(text);
            }
        },

        // FAST: Single attempt summarization via Backend Proxy
        summarizeText: async function (text) {
            if (!text || text.trim().length < 50) {
                return text || 'No description available';
            }

            try {
                const response = await $.ajax({
                    url: "http://localhost:5121/api/AI/summary",
                    method: "POST",
                    contentType: "application/json", // Explicitly set content type
                    data: JSON.stringify({ inputs: text.slice(0, 800) }),
                    timeout: 15000 // Slightly longer timeout for summary
                });

                if (response && response[0] && response[0].summary_text) {
                    return response[0].summary_text;
                }
                throw new Error('Invalid summary response');
            } catch (error) {
                console.warn('Backend summarization failed:', error);
                // Immediate fallback to original text
                return text.slice(0, 200) + (text.length > 200 ? '...' : '');
            }
        }
    },

    // Initialize news manager
    init: function () {
        // console.log('🚀 Initializing NewsManager...');
        NewsManager.setupEventListeners();
        NewsManager.initializeLoadingStates();

        // Load user preference FIRST, then load news
        NewsManager.loadUserPreference().then(function () {
            NewsManager.loadNews(true);
        });
    },

    // Load user preference and set filter
    loadUserPreference: function () {
        return new Promise((resolve) => {
            const userId = localStorage.getItem('userId');

            if (!userId) {
                console.warn('⚠️ No userId found. Skipping preference load.');
                resolve();
                return;
            }

<<<<<<< HEAD
            $.ajax({
                type: 'GET',
                url: `http://localhost:5121/api/users/interests/${userId}`,
                cache: false,
                dataType: "json",
                timeout: 3000,
                success: function (interests) {
                    // console.log('👤 Loaded user interests:', interests);
=======
            ajaxCall(
                'GET',
                `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/interests/${userId}`,
                null,
                function (interests) {
                    console.log('👤 Loaded user interests:', interests);
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5

                    if (Array.isArray(interests) && interests.length > 0) {
                        const savedCategory = interests[0];
                        NewsManager.userPreference = savedCategory;
                        NewsManager.currentFilters.category = savedCategory;

                        const categoryName = savedCategory.charAt(0).toUpperCase() + savedCategory.slice(1);
                        if (typeof showAlert === 'function') {
                            showAlert('info', 'Filtering news by your interest: ' + categoryName);
                        }
                        // console.log('✅ User preference applied: ' + savedCategory);
                    }

                    resolve();
                },
                function (xhr, status, error) {
                    console.warn('⚠️ Failed to load interests:', error);
                    resolve(); // Continue even if this fails
                }
            );
        });
    },

    // Initialize loading states
    initializeLoadingStates: function () {
        var categorySelect = $('#categorySelect');
        var categoriesLoading = $('#categoriesLoading');

        if (categorySelect.length > 0) {
            categorySelect.html('<option value="">Loading categories...</option>');
            categorySelect.prop('disabled', true);
        }
        if (categoriesLoading.length > 0) categoriesLoading.show();

        var sourceSelect = $('#sourceSelect');
        var sourcesLoading = $('#sourcesLoading');

        if (sourceSelect.length > 0) {
            sourceSelect.html('<option value="">Loading sources...</option>');
            sourceSelect.prop('disabled', true);
        }
        if (sourcesLoading.length > 0) sourcesLoading.show();
    },

    // Setup event listeners
    setupEventListeners: function () {
        // Search functionality
        $('#searchBtn').on('click', NewsManager.handleSearch);
        $('#searchInput').on('keypress', function (e) {
            if (e.which === 13) {
                NewsManager.handleSearch();
            }
        });

        // Filter controls
        $('#categorySelect').on('change', NewsManager.handleCategoryFilter);
        $('#sourceSelect').on('change', NewsManager.handleSourceFilter);
        $('#sentimentFilter').on('change', NewsManager.handleSentimentFilter);

        // View toggle
        $('#gridView').on('click', function () {
            NewsManager.switchView('grid');
        });
        $('#listView').on('click', function () {
            NewsManager.switchView('list');
        });

        // Clear filters
        $('#clearFiltersBtn').on('click', NewsManager.clearAllFilters);

        // Refresh button
        $('#refreshNews').on('click', NewsManager.refreshNews);

        // Load more button
        $('#loadMore').on('click', NewsManager.loadMoreArticles);
    },

    // SIMPLIFIED: Load 100 real articles at once
    loadNews: async function (isRefresh = false) {
        // console.log('📰 Loading news...');

        if (NewsManager.isLoading) {
            // console.log('⏳ Already loading, skipping...');
            return;
        }

        NewsManager.isLoading = true;

        // Reset on refresh
        if (isRefresh) {
            NewsManager.displayedCount = NewsManager.pageSize;
            NewsManager.allArticlesData = [];
            NewsManager.articlesData = [];
        }

        $('#newsContainer').hide();
        $('#loadingIndicator').show();
        $('#newsStatus').text('Loading articles...');

        try {
            // Fetch 100 real articles from NewsAPI
            const articles = await NewsManager.fetchRealArticles();

            if (!articles || articles.length === 0) {
                throw new Error('No articles found from NewsAPI');
            }

            // console.log(`📄 Loaded ${articles.length} real articles`);

            // Process articles with categories and sentiment
            const enriched = await NewsManager.enrichArticlesFast(articles);

            // Store all articles
            NewsManager.allArticlesData = enriched;
            NewsManager.articlesData = enriched;
            NewsManager.displayedCount = Math.min(NewsManager.pageSize, enriched.length);

            // Load categories and sources
            NewsManager.loadCategoriesFromArticles();
            NewsManager.loadSourcesFromArticles();

            // Display first batch
            NewsManager.displayNews(NewsManager.articlesData);
            NewsManager.updateStatusMessage({ articles: NewsManager.articlesData });
            NewsManager.updateLoadMoreButton();

            // Enhance with AI in background (non-blocking)
            NewsManager.enhanceWithAIBackground(NewsManager.articlesData);

        } catch (error) {
            console.error('❌ News loading failed:', error);
            NewsManager.showErrorMessage({ message: error.message || 'Failed to load news' });
        } finally {
            NewsManager.isLoading = false;
            $('#loadingIndicator').hide();
            $('#newsContainer').show();
        }
    },

    // Fetch real articles from NewsAPI (aim for 100)
    fetchRealArticles: async function () {
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
                // console.log('🔍 Trying NewsAPI endpoint...');
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

                    // console.log(`✅ Got ${validArticles.length} articles from this endpoint. Total: ${allArticles.length}`);

                    // If we have enough articles, break
                    if (allArticles.length >= 30) {
                        break;
                    }
                }
            } catch (error) {
                console.warn('⚠️ NewsAPI endpoint failed:', endpoint, error);
                continue; // Try next endpoint
            }
        }

        if (allArticles.length === 0) {
            throw new Error('All NewsAPI endpoints failed');
        }

        // Return up to 30 articles
        return allArticles.slice(0, 30);
    },

    // FAST: Quick enrichment without AI delays
    enrichArticlesFast: async function (articles) {
        // console.log('⚡ Fast enriching articles...');

        return articles.map(article => {
            return {
                ...article,
                category: NewsManager.detectCategory(article),
                source: article.source || { name: 'Unknown' },
                sentiment: 'Neutral', // Default to neutral
                summary: article.description || 'No description available' // Use original description
            };
        });
    },

    // BACKGROUND: Optional AI enhancement (non-blocking)
    enhanceWithAIBackground: async function (articles) {
        // console.log('🤖 Starting background AI enhancement...');

        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            const fullText = `${article.title} ${article.description || ''}`;

            try {
                // Try AI sentiment
                const sentimentResult = await NewsManager.HuggingFace.analyzeSentiment(fullText);
                article.sentiment = NewsManager.mapSentimentLabel(sentimentResult.label);

                // Try AI summary
                if (fullText.length > 100) {
                    const summary = await NewsManager.HuggingFace.summarizeText(fullText);
                    if (summary && summary !== article.description) {
                        article.summary = summary;
                    }
                }

                // Update display if this article is visible
                NewsManager.updateArticleDisplay(article, i);

            } catch (error) {
                console.warn('⚠️ Background AI enhancement failed for article:', article.title);
            }
        }

        // console.log('✅ Background AI enhancement complete');
    },

    getCategoryColor: function (category) {
        const map = {
            breaking: '#ff0000',
            business: '#10b981',
            technology: '#8b5cf6',
            sports: '#f59e0b',
            entertainment: '#ec4899',
            health: '#ef4444',
            general: '#3b82f6',
            politics: '#dc2626',
            science: '#0ea5e9'
        };
        return map[category] || '#3b82f6';
    },

    // Update single article display
    updateArticleDisplay: function (article, index) {
        // Find and update the article in the display
        const sentimentBadge = $(`.news-card:eq(${index}) .badge:last`);
        if (sentimentBadge.length > 0) {
            sentimentBadge.removeClass('bg-secondary bg-success bg-danger')
                .addClass(NewsManager.getSentimentBadgeClass(article.sentiment))
                .text(article.sentiment);
        }

        const summaryText = $(`.news-card:eq(${index}) .card-text`);
        if (summaryText.length > 0 && article.summary) {
            summaryText.text(NewsManager.truncateText(article.summary, 120));
        }
    },

    // Detect article category
    detectCategory: function (article) {
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

    // Load categories from articles
    loadCategoriesFromArticles: function () {
        // console.log('📂 Loading categories...');

        var categorySelect = $('#categorySelect');
        var categoriesLoading = $('#categoriesLoading');

        var categoriesWithCount = {};
        NewsManager.allArticlesData.forEach(article => {
            const category = article.category || 'general';
            categoriesWithCount[category] = (categoriesWithCount[category] || 0) + 1;
        });

        NewsManager.populateCategoriesDropdown(categoriesWithCount);

        if (categorySelect.length > 0) categorySelect.prop('disabled', false);
        if (categoriesLoading.length > 0) categoriesLoading.hide();
    },

    // Load sources from articles
    loadSourcesFromArticles: function () {
        // console.log('📰 Loading sources...');

        var sourceSelect = $('#sourceSelect');
        var sourcesLoading = $('#sourcesLoading');

        var sourcesWithCount = {};
        NewsManager.allArticlesData.forEach(article => {
            const sourceName = (article.source && article.source.name) || 'Unknown';
            sourcesWithCount[sourceName] = (sourcesWithCount[sourceName] || 0) + 1;
        });

        NewsManager.populateSourcesDropdown(sourcesWithCount);

        if (sourceSelect.length > 0) sourceSelect.prop('disabled', false);
        if (sourcesLoading.length > 0) sourcesLoading.hide();
    },

    // Populate categories dropdown
    populateCategoriesDropdown: function (categoriesWithCount) {
        var categorySelect = $('#categorySelect');
        if (categorySelect.length === 0) return;

        var html = '<option value="">All Categories</option>';

        var sortedCategories = Object.keys(categoriesWithCount).sort((a, b) =>
            categoriesWithCount[b] - categoriesWithCount[a]
        );

        sortedCategories.forEach(category => {
            const count = categoriesWithCount[category];
            const displayName = NewsManager.formatCategoryName(category);
            const selected = category === NewsManager.currentFilters.category ? 'selected' : '';

            html += `<option value="${category}" ${selected}>${displayName} (${count})</option>`;
        });

        categorySelect.html(html);
    },

    // Populate sources dropdown
    populateSourcesDropdown: function (sourcesWithCount) {
        var sourceSelect = $('#sourceSelect');
        if (sourceSelect.length === 0) return;

        var html = '<option value="">All Sources</option>';

        var sortedSources = Object.keys(sourcesWithCount).sort((a, b) =>
            sourcesWithCount[b] - sourcesWithCount[a]
        );

        sortedSources.forEach(source => {
            const count = sourcesWithCount[source];
            const selected = source === NewsManager.currentFilters.source ? 'selected' : '';

            html += `<option value="${source}" ${selected}>${source} (${count})</option>`;
        });

        sourceSelect.html(html);
    },

    // UPDATED: Display only the first N articles based on displayedCount
    displayNews: function (articles) {
        var container = $('#newsContainer');
        if (container.length === 0) return;

        if (!articles || articles.length === 0) {
            NewsManager.showNoArticlesMessage();
            return;
        }

        var html = '';

        // Only show articles up to displayedCount
        const articlesToShow = articles.slice(0, NewsManager.displayedCount);

        articlesToShow.forEach((article, index) => {
            const imageUrl = article.urlToImage || 'https://picsum.photos/400/200?random=' + index;
            const source = (article.source && article.source.name) || 'Unknown Source';
            const publishedDate = NewsManager.formatDate(article.publishedAt);
            const category = article.category || 'general';
            const sentiment = article.sentiment || 'Neutral';

            if (NewsManager.currentView === 'grid') {
                html += `
                    <div class="col-lg-4 col-md-6 mb-4">
                        <div class="card h-100 news-card">
                            <img src="${imageUrl}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="News Image" 
                                 onerror="this.src='https://picsum.photos/400/200?random=${index}'">
                            <div class="card-body d-flex flex-column">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span class="badge" style="background:${NewsManager.getCategoryColor(category)};">
                                        ${NewsManager.formatCategoryName(category)}
                                    </span>
                                    <span class="badge ${NewsManager.getSentimentBadgeClass(sentiment)}">${sentiment}</span>
                                    ${article.summary && article.summary !== article.description
                        ? '<span class="badge bg-info ms-2">AI Summary</span>'
                        : ''}
                                </div>
                                <h6 class="card-title">
                                    <a href="${article.url}" target="_blank" class="text-decoration-none">
                                        ${article.title}
                                    </a>
                                </h6>
                                
                                <p class="card-text flex-grow-1">
                                    ${NewsManager.truncateText(article.summary || article.description || 'No description available', 120)}
                                </p>
                                
                                <div class="mt-auto">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">${source}</small>
                                        <small class="text-muted">${publishedDate}</small>
                                    </div>
                                    <div class="mt-2">
                                        <button class="btn btn-outline-primary btn-sm" onclick="NewsManager.saveArticle(${index})">
                                            <i class="fas fa-bookmark me-1"></i>Save
                                        </button>
                                        <button class="btn btn-outline-secondary btn-sm ms-1" onclick="NewsManager.shareArticle(${index})">
                                            <i class="fas fa-share me-1"></i>Share
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                html += `
                    <div class="col-12 mb-3">
                        <div class="card news-card">
                            <div class="row g-0">
                                <div class="col-md-3">
                                    <img src="${imageUrl}" class="img-fluid rounded-start h-100" 
                                         style="object-fit: cover; min-height: 150px;" alt="News Image"
                                         onerror="this.src='https://picsum.photos/400/200?random=${index}'">
                                </div>
                                <div class="col-md-9">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <span class="badge bg-primary me-2">${NewsManager.formatCategoryName(category)}</span>
                                                <span class="badge ${NewsManager.getSentimentBadgeClass(sentiment)}">${sentiment}</span>
                                                ${article.summary && article.summary !== article.description
                        ? '<span class="badge bg-info ms-2">AI Summary</span>'
                        : ''}
                                            </div>
                                            <div>
                                                <button class="btn btn-outline-primary btn-sm me-1" onclick="NewsManager.saveArticle(${index})">
                                                    <i class="fas fa-bookmark"></i>
                                                </button>
                                                <button class="btn btn-outline-secondary btn-sm" onclick="NewsManager.shareArticle(${index})">
                                                    <i class="fas fa-share"></i>
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <h6 class="card-title">
                                            <a href="${article.url}" target="_blank" class="text-decoration-none">
                                                ${article.title}
                                            </a>
                                        </h6>
                                        
                                        <p class="card-text">
                                            ${NewsManager.truncateText(article.summary || article.description ||
                            'No description available', 200)}
                                        </p>
                                        
                                        <small class="text-muted">
                                            <i class="fas fa-globe me-1"></i>${source} • ${publishedDate}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }
        });

        container.html(html);
    },

    // Utility functions
    truncateText: function (text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.slice(0, maxLength) + '...';
    },

    formatCategoryName: function (category) {
        if (!category) return 'General';
        return category.charAt(0).toUpperCase() + category.slice(1);
    },

    getSentimentBadgeClass: function (sentiment) {
        switch (sentiment) {
            case 'Positive': return 'bg-success';
            case 'Negative': return 'bg-danger';
            default: return 'bg-secondary';
        }
    },

    formatDate: function (dateString) {
        if (!dateString) return 'Unknown';

        try {
            const date = new Date(dateString);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid date';
        }
    },

    // Simple sentiment detection fallback
    detectSentimentSimple: function (text) {
        if (!text) return { label: 'LABEL_1', score: 0.5 };

        const lowerText = text.toLowerCase();
        const positiveWords = ['success', 'win', 'victory', 'positive', 'good', 'great', 'excellent', 'amazing', 'wonderful', 'breakthrough'];
        const negativeWords = ['crisis', 'disaster', 'fail', 'death', 'war', 'conflict', 'negative', 'bad', 'terrible', 'awful'];

        let positiveCount = 0;
        let negativeCount = 0;

        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveCount++;
        });

        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeCount++;
        });

        if (positiveCount > negativeCount) return { label: 'LABEL_2', score: 0.7 };
        if (negativeCount > positiveCount) return { label: 'LABEL_0', score: 0.7 };
        return { label: 'LABEL_1', score: 0.5 };
    },

    mapSentimentLabel: function (label) {
        switch (label) {
            case 'LABEL_0': return 'Negative';
            case 'LABEL_1': return 'Neutral';
            case 'LABEL_2': return 'Positive';
            default: return 'Neutral';
        }
    },

    // Event handlers
    handleSearch: function () {
        const searchTerm = $('#searchInput').val().trim();
        NewsManager.currentFilters.search = searchTerm;
        NewsManager.filterAndDisplayArticles();
    },

    handleCategoryFilter: function () {
        NewsManager.currentFilters.category = $('#categorySelect').val();
        NewsManager.filterAndDisplayArticles();
    },

    handleSourceFilter: function () {
        NewsManager.currentFilters.source = $('#sourceSelect').val();
        NewsManager.filterAndDisplayArticles();
    },

    handleSentimentFilter: function () {
        const sentimentValue = $('#sentimentFilter').val();
        let mappedSentiment = '';
        switch (sentimentValue) {
            case 'positive': mappedSentiment = 'Positive'; break;
            case 'negative': mappedSentiment = 'Negative'; break;
            case 'neutral': mappedSentiment = 'Neutral'; break;
            default: mappedSentiment = '';
        }
        NewsManager.currentFilters.sentiment = mappedSentiment;
        NewsManager.filterAndDisplayArticles();
    },

    // Filter and display articles
    filterAndDisplayArticles: function () {
        // console.log('🔍 Applying filters...');

        let filtered = NewsManager.allArticlesData.slice();

        if (NewsManager.currentFilters.category) {
            filtered = filtered.filter(article => article.category === NewsManager.currentFilters.category);
        }

        if (NewsManager.currentFilters.source) {
            filtered = filtered.filter(article => (article.source && article.source.name) === NewsManager.currentFilters.source);
        }

        if (NewsManager.currentFilters.sentiment) {
            filtered = filtered.filter(article => article.sentiment === NewsManager.currentFilters.sentiment);
        }

        if (NewsManager.currentFilters.search) {
            const searchTerm = NewsManager.currentFilters.search.toLowerCase();
            filtered = filtered.filter(article =>
                article.title.toLowerCase().includes(searchTerm) ||
                (article.description || '').toLowerCase().includes(searchTerm)
            );
        }

        NewsManager.articlesData = filtered;
        NewsManager.displayedCount = Math.min(NewsManager.pageSize, filtered.length);
        NewsManager.displayNews(filtered);
        NewsManager.updateStatusMessage({ articles: filtered, totalResults: filtered.length });

        // Hide load more when filtering
        $('#loadMore').hide();
    },

    // Switch view
    switchView: function (view) {
        NewsManager.currentView = view;
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

        NewsManager.displayNews(NewsManager.articlesData);
    },

    // Clear all filters
    clearAllFilters: function () {
        NewsManager.currentFilters = { category: '', source: '', search: '', sentiment: '' };

        $('#searchInput').val('');
        $('#categorySelect').val('');
        $('#sourceSelect').val('');
        $('#sentimentFilter').val('');

        NewsManager.articlesData = NewsManager.allArticlesData;
        NewsManager.displayedCount = Math.min(NewsManager.pageSize, NewsManager.allArticlesData.length);
        NewsManager.displayNews(NewsManager.articlesData);
        NewsManager.updateStatusMessage({ articles: NewsManager.articlesData, totalResults: NewsManager.articlesData.length });

        // Show load more if there are more articles
        NewsManager.updateLoadMoreButton();

        if (typeof showAlert === 'function') {
            showAlert('info', 'All filters cleared');
        }
    },

    // Refresh news
    refreshNews: function () {
        NewsManager.displayedCount = NewsManager.pageSize;
        NewsManager.loadNews(true);
    },

    // UPDATED: Frontend pagination - show more from already loaded articles
    loadMoreArticles: function () {
        const totalArticles = NewsManager.articlesData.length;
        const newDisplayCount = NewsManager.displayedCount + NewsManager.pageSize;

        if (NewsManager.displayedCount >= totalArticles) {
            if (typeof showAlert === 'function') {
                showAlert('info', 'All articles are already loaded');
            }
            $('#loadMore').hide();
            return;
        }

        NewsManager.displayedCount = Math.min(newDisplayCount, totalArticles);
        NewsManager.displayNews(NewsManager.articlesData);
        NewsManager.updateStatusMessage({ articles: NewsManager.articlesData });

        // Update load more button
        NewsManager.updateLoadMoreButton();

        if (NewsManager.displayedCount >= totalArticles && typeof showAlert === 'function') {
            showAlert('success', `All ${totalArticles} articles loaded!`);
        }
    },

    // Update load more button based on displayed vs total articles
    updateLoadMoreButton: function () {
        const loadMoreContainer = $('#loadMore');
        const totalArticles = NewsManager.articlesData.length;

        if (NewsManager.displayedCount < totalArticles) {
            loadMoreContainer.show();
        } else {
            loadMoreContainer.hide();
        }
    },

    // UPDATED: Status message to show "X of Y articles"
    updateStatusMessage: function (response) {
        const statusElement = $('#newsStatus');
        if (statusElement.length === 0) return;

        let message = `Showing ${NewsManager.displayedCount} of ${NewsManager.allArticlesData.length} articles`;

        if (NewsManager.currentFilters.source) {
            message += ' from ' + NewsManager.currentFilters.source;
        }

        if (NewsManager.currentFilters.category) {
            message += ' in ' + NewsManager.formatCategoryName(NewsManager.currentFilters.category);
        }

        if (NewsManager.currentFilters.search) {
            message += ' for "' + NewsManager.currentFilters.search + '"';
        }

        statusElement.text(message);
    },

    // Save article
    saveArticle: function (index) {
        const article = NewsManager.articlesData[index];
        if (!article) {
            if (typeof showAlert === 'function') {
                showAlert('danger', 'Article not found');
            }
            return;
        }

        const userId = localStorage.getItem('userId');
        if (!userId) {
            if (typeof showAlert === 'function') {
                showAlert('warning', 'Please log in to save articles');
            }
            return;
        }

        // API call to save article to user's saved list
        ajaxCall(
            'POST',
            `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/news/save?userId=${userId}`,
            JSON.stringify({
                title: article.title,
                content: article.description,
                url: article.url,
                urlToImage: article.urlToImage,
                publishedAt: article.publishedAt,
                source: (article.source && article.source.name) || 'Unknown',
                author: article.author || null,
                category: article.category || 'general',
                sentiment: article.sentiment || null,
                country: article.country || null
            }),
            function (response) {
                if (response && response.newsId) {
                    if (typeof showAlert === 'function') {
                        showAlert('success', 'Article saved successfully!');
                    }
                } else {
                    if (typeof showAlert === 'function') {
                        showAlert('warning', 'Article may already be saved');
                    }
                }
            },
            function (xhr, status, error) {
                console.error('Save failed:', xhr.responseText);
                if (typeof showAlert === 'function') {
                    showAlert('danger', 'Failed to save article: ' + (xhr.responseJSON?.message || error));
                }
            }
        );
    },

    // Share article
    shareArticle: function (index) {
        const article = NewsManager.articlesData[index];
        if (!article) return;

        // Use community share modal instead of native sharing
        if (typeof window.openCommunityShareModal === 'function') {
            window.openCommunityShareModal(article);
        } else {
            // Fallback to original sharing if function not available
            if (navigator.share) {
                navigator.share({
                    title: article.title,
                    text: article.description,
                    url: article.url
                });
            } else if (navigator.clipboard) {
                navigator.clipboard.writeText(article.url).then(() => {
                    if (typeof showAlert === 'function') {
                        showAlert('success', 'Article URL copied to clipboard');
                    }
                });
            }
        }
    },

    // Show no articles message
    showNoArticlesMessage: function () {
        const container = $('#newsContainer');
        if (container.length === 0) return;

        const isFilterActive = NewsManager.currentFilters.source ||
            NewsManager.currentFilters.search ||
            NewsManager.currentFilters.category ||
            NewsManager.currentFilters.sentiment;

        container.html(`
            <div class="col-12 text-center">
                <div class="card">
                    <div class="card-body">
                        <i class="fas fa-newspaper fa-3x text-muted mb-3"></i>
                        <h5>No Articles Found</h5>
                        <p class="text-muted">
                            ${isFilterActive ?
                'No articles match your current filter settings.' :
                'No news articles are currently available.'}
                        </p>
                        ${isFilterActive ?
                '<button class="btn btn-outline-primary me-2" onclick="NewsManager.clearAllFilters()"><i class="fas fa-times me-1"></i>Clear Filters</button>' : ''}
                        <button class="btn btn-primary" onclick="NewsManager.refreshNews()">
                            <i class="fas fa-sync-alt me-1"></i>Refresh News
                        </button>
                    </div>
                </div>
            </div>
        `);
    },

    // Show error message
    showErrorMessage: function (error) {
        const container = $('#newsContainer');
        if (container.length === 0) return;

        container.html(`
            <div class="col-12 text-center">
                <div class="card">
                    <div class="card-body">
                        <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                        <h5>Failed to Load News</h5>
                        <p class="text-muted">
                            ${error.message || 'There was an error loading news articles.'}<br>
                            Please try refreshing or check back later.
                        </p>
                        <button class="btn btn-primary" onclick="NewsManager.refreshNews()">
                            <i class="fas fa-sync-alt me-1"></i>Try Again
                        </button>
                    </div>
                </div>
            </div>
        `);
    }
};

// Initialize when page loads
$(document).ready(function () {
    if (window.location.pathname.includes('news.html') || window.location.href.includes('news.html')) {
        // console.log('🚀 News page detected, initializing NewsManager...');
        NewsManager.init();
    }
});