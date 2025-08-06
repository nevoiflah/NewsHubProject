// maps.js - Enhanced version with clustering and better visuals
var NewsMap = {
    map: null,
    markers: [],
    markerClusterGroup: null,
    newsData: [],
    filteredData: [],
    defaultBounds: null,
    currentFilters: {
        category: '',
        source: '',
        search: '',
        dateRange: ''
    },
    
    // Initialize the news map
    init: function() {
        NewsMap.initializeMap();
        NewsMap.setupEventListeners();
        NewsMap.loadNewsData();
    },

    // Initialize Leaflet map with better settings
    initializeMap: function() {
        // Initialize the map with better zoom and center
        NewsMap.map = L.map('map', {
            zoomControl: true,
            maxZoom: 18,
            minZoom: 2,
            maxBounds: [[-85, -180], [85, 180]], // Limit panning to roughly the visible world
            maxBoundsViscosity: 1.0             // Makes the bounds feel solid
        }).setView([30, 0], 3);

        // Add OpenStreetMap tiles with better styling
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
        }).addTo(NewsMap.map);

        // Initialize marker cluster group with custom options
        NewsMap.markerClusterGroup = L.markerClusterGroup({
            // Customize cluster appearance
            iconCreateFunction: function(cluster) {
                var count = cluster.getChildCount();
                var size = 'marker-cluster-';
                
                if (count < 10) {
                    size += 'small';
                } else if (count < 100) {
                    size += 'medium';
                } else {
                    size += 'large';
                }
                
                return new L.DivIcon({
                    html: '<div><span>' + count + '</span></div>',
                    className: 'marker-cluster ' + size,
                    iconSize: new L.Point(40, 40)
                });
            },
            spiderfyOnMaxZoom: true,
            showCoverageOnHover: false,
            zoomToBoundsOnClick: true,
            maxClusterRadius: 80
        });

        NewsMap.map.addLayer(NewsMap.markerClusterGroup);

        // Set default bounds (roughly world view but not too zoomed out)
        NewsMap.defaultBounds = [[-60, -180], [85, 180]];

        console.log('🗺️ Map initialized with clustering support');
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Filter controls
        $('#categoryFilter').on('change', NewsMap.handleCategoryFilter);
        $('#sourceFilter').on('change', NewsMap.handleSourceFilter);
        $('#searchMap').on('input', NewsMap.handleSearchFilter);
        $('#dateRangeFilter').on('change', NewsMap.handleDateFilter);
        
        // Clear filters button
        $('#clearMapFilters').on('click', NewsMap.clearAllFilters);
        
        // Refresh data
        $('#refreshMapData').on('click', NewsMap.refreshData);
        
        // Reset view button
        $('#resetMapView').on('click', NewsMap.resetMapView);
        
        // Toggle clustering
        $('#showClusters').on('change', NewsMap.toggleClusters);
    },

    // Enhanced location detection with better coordinates
    addGeographicCoordinates: function(articles) {
        const locationsDB = {
            // Major US cities with precise coordinates
            'new york': { lat: 40.7589, lng: -73.9851, country: 'USA', zoom: 10 },
            'los angeles': { lat: 34.0522, lng: -118.2437, country: 'USA', zoom: 10 },
            'chicago': { lat: 41.8781, lng: -87.6298, country: 'USA', zoom: 10 },
            'houston': { lat: 29.7604, lng: -95.3698, country: 'USA', zoom: 10 },
            'phoenix': { lat: 33.4484, lng: -112.0740, country: 'USA', zoom: 10 },
            'philadelphia': { lat: 39.9526, lng: -75.1652, country: 'USA', zoom: 10 },
            'san antonio': { lat: 29.4241, lng: -98.4936, country: 'USA', zoom: 10 },
            'san diego': { lat: 32.7157, lng: -117.1611, country: 'USA', zoom: 10 },
            'dallas': { lat: 32.7767, lng: -96.7970, country: 'USA', zoom: 10 },
            'san jose': { lat: 37.3382, lng: -121.8863, country: 'USA', zoom: 10 },
            'washington': { lat: 38.9072, lng: -77.0369, country: 'USA', zoom: 10 },
            'seattle': { lat: 47.6062, lng: -122.3321, country: 'USA', zoom: 10 },
            'denver': { lat: 39.7392, lng: -104.9903, country: 'USA', zoom: 10 },
            'las vegas': { lat: 36.1699, lng: -115.1398, country: 'USA', zoom: 10 },
            'miami': { lat: 25.7617, lng: -80.1918, country: 'USA', zoom: 10 },
            'atlanta': { lat: 33.7490, lng: -84.3880, country: 'USA', zoom: 10 },
            'boston': { lat: 42.3601, lng: -71.0589, country: 'USA', zoom: 10 },
            'san francisco': { lat: 37.7749, lng: -122.4194, country: 'USA', zoom: 10 },
            
            // International cities with precise coordinates
            'london': { lat: 51.5074, lng: -0.1278, country: 'UK', zoom: 10 },
            'paris': { lat: 48.8566, lng: 2.3522, country: 'France', zoom: 10 },
            'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan', zoom: 10 },
            'beijing': { lat: 39.9042, lng: 116.4074, country: 'China', zoom: 10 },
            'moscow': { lat: 55.7558, lng: 37.6173, country: 'Russia', zoom: 10 },
            'berlin': { lat: 52.5200, lng: 13.4050, country: 'Germany', zoom: 10 },
            'sydney': { lat: -33.8688, lng: 151.2093, country: 'Australia', zoom: 10 },
            'toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada', zoom: 10 },
            'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India', zoom: 10 },
            'dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE', zoom: 10 },
            'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore', zoom: 10 },
            'hong kong': { lat: 22.3193, lng: 114.1694, country: 'Hong Kong', zoom: 10 },
            'amsterdam': { lat: 52.3676, lng: 4.9041, country: 'Netherlands', zoom: 10 },
            'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy', zoom: 10 },
            'madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain', zoom: 10 },
            
            // Countries/regions (use capital cities but with country zoom)
            'usa': { lat: 39.8283, lng: -98.5795, country: 'USA', zoom: 4 },
            'united states': { lat: 39.8283, lng: -98.5795, country: 'USA', zoom: 4 },
            'uk': { lat: 54.3781, lng: -3.4360, country: 'UK', zoom: 6 },
            'united kingdom': { lat: 54.3781, lng: -3.4360, country: 'UK', zoom: 6 },
            'france': { lat: 46.2276, lng: 2.2137, country: 'France', zoom: 6 },
            'germany': { lat: 51.1657, lng: 10.4515, country: 'Germany', zoom: 6 },
            'japan': { lat: 36.2048, lng: 138.2529, country: 'Japan', zoom: 6 },
            'china': { lat: 35.8617, lng: 104.1954, country: 'China', zoom: 4 },
            'russia': { lat: 61.5240, lng: 105.3188, country: 'Russia', zoom: 3 },
            'australia': { lat: -25.2744, lng: 133.7751, country: 'Australia', zoom: 5 },
            'canada': { lat: 56.1304, lng: -106.3468, country: 'Canada', zoom: 4 },
            'india': { lat: 20.5937, lng: 78.9629, country: 'India', zoom: 5 }
        };
        
        const articlesWithCoords = [];
        
        for (var i = 0; i < articles.length; i++) {
            var article = articles[i];
            var text = ((article.title || '') + ' ' + (article.description || '') + ' ' + ((article.source && article.source.name) || '')).toLowerCase();
            var coordinates = null;
            var detectedLocation = 'Unknown';
            var suggestedZoom = 8;
            
            // Enhanced location detection with priority to more specific locations
            var bestMatch = null;
            var bestMatchLength = 0;
            
            for (var location in locationsDB) {
                if (text.indexOf(location) !== -1) {
                    // Prefer longer, more specific matches
                    if (location.length > bestMatchLength) {
                        bestMatch = location;
                        bestMatchLength = location.length;
                    }
                }
            }
            
            if (bestMatch) {
                coordinates = locationsDB[bestMatch];
                detectedLocation = bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1);
                suggestedZoom = coordinates.zoom || 8;
            }
            
            // Enhanced fallback based on source analysis
            if (!coordinates) {
                var sourceName = (article.source && article.source.name || '').toLowerCase();
                
                // More sophisticated source-based location detection
                if (sourceName.includes('cnn') || sourceName.includes('fox') || 
                    sourceName.includes('nbc') || sourceName.includes('abc') ||
                    sourceName.includes('cbs') || sourceName.includes('usa') ||
                    sourceName.includes('washington') || sourceName.includes('times')) {
                    coordinates = locationsDB['usa'];
                    detectedLocation = 'USA';
                    suggestedZoom = 4;
                } else if (sourceName.includes('bbc') || sourceName.includes('guardian') || sourceName.includes('reuters')) {
                    coordinates = locationsDB['uk'];
                    detectedLocation = 'UK';
                    suggestedZoom = 6;
                } else if (sourceName.includes('le ') || sourceName.includes('france')) {
                    coordinates = locationsDB['france'];
                    detectedLocation = 'France';
                    suggestedZoom = 6;
                } else {
                    // More distributed default locations to avoid clustering
                    var defaultLocations = [
                        { ...locationsDB['usa'], location: 'USA' },
                        { ...locationsDB['uk'], location: 'UK' },
                        { ...locationsDB['france'], location: 'France' },
                        { ...locationsDB['germany'], location: 'Germany' },
                        { ...locationsDB['japan'], location: 'Japan' }
                    ];
                    var randomDefault = defaultLocations[i % defaultLocations.length];
                    coordinates = randomDefault;
                    detectedLocation = randomDefault.location;
                    suggestedZoom = 6;
                }
            }
            
            // Add some random offset to avoid exact overlapping (within ~50km radius)
            var latOffset = (Math.random() - 0.5) * 0.5; // ~55km
            var lngOffset = (Math.random() - 0.5) * 0.5; // ~55km
            
            var articleWithCoords = Object.assign({}, article, {
                lat: coordinates.lat + latOffset,
                lng: coordinates.lng + lngOffset,
                originalLat: coordinates.lat,
                originalLng: coordinates.lng,
                location: detectedLocation,
                country: coordinates.country,
                suggestedZoom: suggestedZoom,
                category: NewsMap.detectCategory(article)
            });
            
            articlesWithCoords.push(articleWithCoords);
        }
        
        return articlesWithCoords;
    },

    // Enhanced custom icons for different categories
    getMarkerIcon: function(category) {
        const iconConfigs = {
            'general': { color: '#3b82f6', icon: '📰' },
            'business': { color: '#10b981', icon: '💼' },
            'technology': { color: '#8b5cf6', icon: '💻' },
            'health': { color: '#ef4444', icon: '🏥' },
            'sports': { color: '#f59e0b', icon: '⚽' },
            'politics': { color: '#dc2626', icon: '🏛️' },
            'entertainment': { color: '#ec4899', icon: '🎬' },
            'science': { color: '#0ea5e9', icon: '🔬' },
            'breaking': { color: '#ff0000', icon: '🚨' }
        };
        
        const config = iconConfigs[category] || iconConfigs['general'];
        
        return L.divIcon({
            className: 'custom-news-marker',
            html: `
                <div style="
                    background: ${config.color}; 
                    width: 30px; 
                    height: 30px; 
                    border-radius: 50%; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    font-size: 14px;
                    border: 2px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">
                    ${config.icon}
                </div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
    },

    // Enhanced popup content with better styling
    createPopupContent: function(articles) {
        var location = articles[0].location;
        var articleCount = articles.length;
        
        var content = '<div class="map-popup" style="max-width: 350px;">';
        content += `<h6 class="text-primary mb-2" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">
                        <i class="fas fa-map-marker-alt me-1"></i>${location}
                        <span class="badge bg-primary ms-2">${articleCount} article${articleCount > 1 ? 's' : ''}</span>
                    </h6>`;
        
        // Show up to 3 articles with enhanced styling
        var articlesToShow = articles.slice(0, 3);
        
        for (var i = 0; i < articlesToShow.length; i++) {
            var article = articlesToShow[i];
            var categoryIcon = NewsMap.getCategoryIcon(article.category);
            var categoryBadge = `<span class="badge" style="background: ${NewsMap.getCategoryColor(article.category)}; font-size: 0.7rem;">
                                    ${categoryIcon} ${NewsMap.formatCategoryName(article.category)}
                                </span>`;
            
            content += '<div style="border-left: 3px solid ' + NewsMap.getCategoryColor(article.category) + '; padding-left: 12px; margin-bottom: 12px; background: #f8fafc; padding: 8px; border-radius: 4px;">';
            content += categoryBadge;
            content += '<h6 style="margin: 6px 0 4px 0; font-size: 0.9rem;"><a href="' + article.url + '" target="_blank" style="text-decoration: none; color: #1e293b;">' + 
                       article.title.substring(0, 80) + (article.title.length > 80 ? '...' : '') + '</a></h6>';
            content += '<p style="margin: 4px 0; font-size: 0.8rem; color: #64748b;">' + 
                       (article.description ? article.description.substring(0, 100) + '...' : 'No description') + '</p>';
            content += '<small style="color: #94a3b8;"><i class="fas fa-globe me-1"></i>' + 
                       ((article.source && article.source.name) || 'Unknown') + ' • ' + NewsMap.formatDate(article.publishedAt) + '</small>';
            content += '</div>';
        }
        
        if (articles.length > 3) {
            content += `<div style="text-align: center; padding: 8px; background: #f1f5f9; border-radius: 4px; margin-top: 8px;">
                            <small style="color: #475569; font-weight: 500;">
                                + ${articles.length - 3} more article${articles.length - 3 > 1 ? 's' : ''} from this location
                            </small>
                        </div>`;
        }
        
        content += '</div>';
        return content;
    },

    // Helper function to get category color
    getCategoryColor: function(category) {
        const colors = {
            'general': '#3b82f6',
            'business': '#10b981',
            'technology': '#8b5cf6',
            'health': '#ef4444',
            'sports': '#f59e0b',
            'politics': '#dc2626',
            'entertainment': '#ec4899',
            'science': '#0ea5e9',
            'breaking': '#ff0000'
        };
        return colors[category] || colors['general'];
    },

    // Helper function to get category icon
    getCategoryIcon: function(category) {
        const icons = {
            'general': '📰',
            'business': '💼',
            'technology': '💻',
            'health': '🏥',
            'sports': '⚽',
            'politics': '🏛️',
            'entertainment': '🎬',
            'science': '🔬',
            'breaking': '🚨'
        };
        return icons[category] || icons['general'];
    },

    // Enhanced display function with clustering
    displayMarkersOnMap: function() {
        // Clear existing markers
        NewsMap.clearMarkers();
        
        if (!NewsMap.filteredData || NewsMap.filteredData.length === 0) {
            console.log('📍 No articles to display on map');
            return;
        }
        
        // Group articles by approximate location (for popup grouping)
        var locationGroups = {};
        var groupingRadius = 0.1; // degrees (~11km)
        
        for (var i = 0; i < NewsMap.filteredData.length; i++) {
            var article = NewsMap.filteredData[i];
            
            // Find existing group within radius
            var foundGroup = false;
            for (var locationKey in locationGroups) {
                var groupLat = parseFloat(locationKey.split(',')[0]);
                var groupLng = parseFloat(locationKey.split(',')[1]);
                
                var distance = Math.sqrt(Math.pow(article.lat - groupLat, 2) + Math.pow(article.lng - groupLng, 2));
                if (distance < groupingRadius) {
                    locationGroups[locationKey].push(article);
                    foundGroup = true;
                    break;
                }
            }
            
            if (!foundGroup) {
                var locationKey = article.lat + ',' + article.lng;
                locationGroups[locationKey] = [article];
            }
        }
        
        // Create markers for each location group
        for (var locationKey in locationGroups) {
            var articles = locationGroups[locationKey];
            var firstArticle = articles[0];
            
            // Create marker with custom icon
            var marker = L.marker([firstArticle.lat, firstArticle.lng], {
                icon: NewsMap.getMarkerIcon(firstArticle.category)
            });
            
            // Create enhanced popup content
            var popupContent = NewsMap.createPopupContent(articles);
            marker.bindPopup(popupContent, { 
                maxWidth: 400,
                className: 'news-popup'
            });
            
            // Add to cluster group
            NewsMap.markerClusterGroup.addLayer(marker);
            NewsMap.markers.push(marker);
        }
        
        console.log('📍 Added ' + NewsMap.markers.length + ' markers to map with clustering');
        
        // Auto-fit bounds if there are markers
        if (NewsMap.markers.length > 0) {
            var group = new L.featureGroup(NewsMap.markers);
            var bounds = group.getBounds();
            
            // Ensure bounds are not too zoomed in or out
            var zoom = NewsMap.map.getBoundsZoom(bounds);
            if (zoom > 12) zoom = 12; // Don't zoom in too much
            if (zoom < 3) zoom = 3;   // Don't zoom out too much
            
            NewsMap.map.fitBounds(bounds, { 
                padding: [20, 20],
                maxZoom: zoom
            });
        }
    },

    // Clear all markers
    clearMarkers: function() {
        if (NewsMap.markerClusterGroup) {
            NewsMap.markerClusterGroup.clearLayers();
        }
        NewsMap.markers = [];
    },

    // Reset map view to default
    resetMapView: function() {
        if (NewsMap.markers.length > 0) {
            // If we have markers, fit to those
            var group = new L.featureGroup(NewsMap.markers);
            var bounds = group.getBounds();
            var zoom = NewsMap.map.getBoundsZoom(bounds);
            if (zoom > 12) zoom = 12;
            if (zoom < 3) zoom = 3;
            
            NewsMap.map.fitBounds(bounds, { 
                padding: [20, 20],
                maxZoom: zoom 
            });
        } else {
            // Reset to world view
            NewsMap.map.setView([30, 0], 3);
        }
        
    },

    // Toggle clustering
    toggleClusters: function () {
        const $checkbox = $('#showClusters');
        const isChecked = $checkbox.is(':checked');
        const $label = $('#clusterToggle');

        if (isChecked) {
            if (!NewsMap.map.hasLayer(NewsMap.markerClusterGroup)) {
                NewsMap.map.addLayer(NewsMap.markerClusterGroup);
            }

            // Remove individual markers if already added
            NewsMap.markers.forEach(m => NewsMap.map.removeLayer(m));

            $label.addClass('active');
        } else {
            if (NewsMap.map.hasLayer(NewsMap.markerClusterGroup)) {
                NewsMap.map.removeLayer(NewsMap.markerClusterGroup);
            }

            // Add individual markers
            NewsMap.markers.forEach(m => m.addTo(NewsMap.map));

            $label.removeClass('active');
        }
    },

    // Load news data (keeping existing implementation)
    loadNewsData: function () {
        console.log('📡 Loading news data for map...');

        const API_KEY = '1c92222d21a84a7ab30168a35d967b22';

        $.ajax({
            type: 'GET',
            url: `https://newsapi.org/v2/everything?q=*&language=en&sortBy=publishedAt&apiKey=${API_KEY}`,
            cache: false,
            dataType: "json",
            success: function (response) {
                if (response && response.articles && response.articles.length > 0) {
                    console.log('📊 Loaded ' + response.articles.length + ' articles for mapping');

                    // Add geographic coordinates to articles with enhanced positioning
                    NewsMap.newsData = NewsMap.addGeographicCoordinates(response.articles);
                    console.log('🗺️ Added coordinates to ' + NewsMap.newsData.length + ' articles');

                    NewsMap.loadCategoriesFromArticles();
                    NewsMap.loadSourcesFromArticles();

                    NewsMap.filteredData = NewsMap.newsData.slice();
                    NewsMap.updateStatistics();
                    NewsMap.displayMarkersOnMap();
                } else {
                    console.log('❌ No articles received from API');
                    NewsMap.newsData = [];
                    NewsMap.filteredData = [];
                    NewsMap.loadEmptyCategories();
                    NewsMap.loadEmptySources();
                    NewsMap.updateStatistics();
                }
            },
            error: function (xhr, status, error) {
                console.error('❌ Error loading news data:', error);
                NewsMap.newsData = [];
                NewsMap.filteredData = [];
                NewsMap.loadEmptyCategories();
                NewsMap.loadEmptySources();
                NewsMap.updateStatistics();

                showAlert('danger', 'Failed to load news data for mapping');
            }
        });
    }
,

    // Detect article category (keeping existing implementation)
    detectCategory: function(article) {
        var text = ((article.title || '') + ' ' + (article.description || '')).toLowerCase();
        
        if (text.indexOf('breaking') !== -1 || text.indexOf('urgent') !== -1) return 'breaking';
        if (text.indexOf('business') !== -1 || text.indexOf('economic') !== -1 || text.indexOf('market') !== -1) return 'business';
        if (text.indexOf('technology') !== -1 || text.indexOf('tech') !== -1 || text.indexOf('digital') !== -1) return 'technology';
        if (text.indexOf('health') !== -1 || text.indexOf('medical') !== -1) return 'health';
        if (text.indexOf('sports') !== -1 || text.indexOf('football') !== -1 || text.indexOf('basketball') !== -1) return 'sports';
        if (text.indexOf('politics') !== -1 || text.indexOf('election') !== -1 || text.indexOf('government') !== -1) return 'politics';
        if (text.indexOf('entertainment') !== -1 || text.indexOf('celebrity') !== -1 || text.indexOf('movie') !== -1) return 'entertainment';
        if (text.indexOf('science') !== -1 || text.indexOf('research') !== -1 || text.indexOf('study') !== -1) return 'science';
        
        return 'general';
    },

    // Keep all existing filter and utility functions...
    loadCategoriesFromArticles: function() {
        console.log('📂 Loading categories from articles...');
        
        var categorySelect = $('#categoryFilter');
        var categoriesLoading = $('#categoriesLoading');
        
        if (categorySelect.length > 0) {
            categorySelect.prop('disabled', true);
        }
        if (categoriesLoading.length > 0) categoriesLoading.show();
        
        var categoriesWithCount = {};
        for (var i = 0; i < NewsMap.newsData.length; i++) {
            var article = NewsMap.newsData[i];
            var category = article.category || 'general';
            categoriesWithCount[category] = (categoriesWithCount[category] || 0) + 1;
        }
        
        NewsMap.populateCategoriesDropdown(categoriesWithCount);
        
        if (categorySelect.length > 0) categorySelect.prop('disabled', false);
        if (categoriesLoading.length > 0) categoriesLoading.hide();
        
        console.log('✅ Loaded ' + Object.keys(categoriesWithCount).length + ' categories');
    },

    loadSourcesFromArticles: function() {
        console.log('📰 Loading sources from articles...');
        
        var sourceSelect = $('#sourceFilter');
        var sourcesLoading = $('#sourcesLoading');
        
        if (sourceSelect.length > 0) {
            sourceSelect.prop('disabled', true);
        }
        if (sourcesLoading.length > 0) sourcesLoading.show();
        
        var sourcesWithCount = {};
        for (var i = 0; i < NewsMap.newsData.length; i++) {
            var article = NewsMap.newsData[i];
            var sourceName = (article.source && article.source.name) || 'Unknown';
            sourcesWithCount[sourceName] = (sourcesWithCount[sourceName] || 0) + 1;
        }
        
        NewsMap.populateSourcesDropdown(sourcesWithCount);
        
        if (sourceSelect.length > 0) sourceSelect.prop('disabled', false);
        if (sourcesLoading.length > 0) sourcesLoading.hide();
        
        console.log('✅ Loaded ' + Object.keys(sourcesWithCount).length + ' sources');
    },

    populateCategoriesDropdown: function(categoriesWithCount) {
        var categorySelect = $('#categoryFilter');
        if (categorySelect.length === 0) return;
        
        var html = '<option value="">All Categories</option>';
        
        var sortedCategories = Object.keys(categoriesWithCount).sort(function(a, b) {
            return categoriesWithCount[b] - categoriesWithCount[a];
        });
        
        for (var i = 0; i < sortedCategories.length; i++) {
            var category = sortedCategories[i];
            var count = categoriesWithCount[category];
            var displayName = NewsMap.formatCategoryName(category);
            
            html += '<option value="' + category + '">' + displayName + ' (' + count + ')</option>';
        }
        
        categorySelect.html(html);
    },

    populateSourcesDropdown: function(sourcesWithCount) {
        var sourceSelect = $('#sourceFilter');
        if (sourceSelect.length === 0) return;
        
        var html = '<option value="">All Sources</option>';
        
        var sortedSources = Object.keys(sourcesWithCount).sort(function(a, b) {
            return sourcesWithCount[b] - sourcesWithCount[a];
        });
        
        for (var i = 0; i < sortedSources.length; i++) {
            var source = sortedSources[i];
            var count = sourcesWithCount[source];
            
            html += '<option value="' + source + '">' + source + ' (' + count + ')</option>';
        }
        
        sourceSelect.html(html);
    },

    loadEmptyCategories: function() {
        var categorySelect = $('#categoryFilter');
        var categoriesLoading = $('#categoriesLoading');
        
        if (categorySelect.length > 0) {
            categorySelect.html('<option value="">No categories available</option>');
            categorySelect.prop('disabled', true);
        }
        if (categoriesLoading.length > 0) categoriesLoading.hide();
    },

    loadEmptySources: function() {
        var sourceSelect = $('#sourceFilter');
        var sourcesLoading = $('#sourcesLoading');
        
        if (sourceSelect.length > 0) {
            sourceSelect.html('<option value="">No sources available</option>');
            sourceSelect.prop('disabled', true);
        }
        if (sourcesLoading.length > 0) sourcesLoading.hide();
    },

    // Event handlers
    handleCategoryFilter: function() {
        NewsMap.currentFilters.category = $('#categoryFilter').val();
        NewsMap.applyFilters();
    },

    handleSourceFilter: function() {
        NewsMap.currentFilters.source = $('#sourceFilter').val();
        NewsMap.applyFilters();
    },

    handleSearchFilter: function() {
        NewsMap.currentFilters.search = $('#searchMap').val().trim();
        NewsMap.applyFilters();
    },

    handleDateFilter: function() {
        NewsMap.currentFilters.dateRange = $('#dateRangeFilter').val();
        NewsMap.applyFilters();
    },

    applyFilters: function() {
        console.log('🔍 Applying map filters...');
        
        var filtered = NewsMap.newsData.slice();
        
        if (NewsMap.currentFilters.category) {
            filtered = filtered.filter(function(article) {
                return article.category === NewsMap.currentFilters.category;
            });
        }
        
        if (NewsMap.currentFilters.source) {
            filtered = filtered.filter(function(article) {
                return (article.source && article.source.name) === NewsMap.currentFilters.source;
            });
        }
        
        if (NewsMap.currentFilters.search) {
            var searchTerm = NewsMap.currentFilters.search.toLowerCase();
            filtered = filtered.filter(function(article) {
                return article.title.toLowerCase().indexOf(searchTerm) !== -1 ||
                       (article.description || '').toLowerCase().indexOf(searchTerm) !== -1;
            });
        }
        
        if (NewsMap.currentFilters.dateRange) {
            var now = new Date();
            var cutoffDate;
            
            switch (NewsMap.currentFilters.dateRange) {
                case '24h':
                    cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30d':
                    cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    cutoffDate = null;
            }
            
            if (cutoffDate) {
                filtered = filtered.filter(function(article) {
                    return new Date(article.publishedAt) >= cutoffDate;
                });
            }
        }
        
        NewsMap.filteredData = filtered;
        NewsMap.displayMarkersOnMap();
        NewsMap.updateStatistics();
        
        console.log('✅ Map filters applied, showing ' + filtered.length + ' articles');
    },

    clearAllFilters: function() {
        NewsMap.currentFilters = {
            category: '',
            source: '',
            search: '',
            dateRange: ''
        };
        
        $('#categoryFilter').val('');
        $('#sourceFilter').val('');
        $('#searchMap').val('');
        $('#dateRangeFilter').val('');
        
        NewsMap.filteredData = NewsMap.newsData.slice();
        NewsMap.displayMarkersOnMap();
        NewsMap.updateStatistics();
        
        showAlert('info', 'All map filters cleared');
    },

    refreshData: function() {
        NewsMap.loadNewsData();
        showAlert('info', 'Map data refreshed');
    },

    updateStatistics: function() {
        var totalArticles = NewsMap.newsData.length;
        var filteredArticles = NewsMap.filteredData.length;
        var uniqueLocations = NewsMap.getUniqueLocations().length;
        
        $('#totalArticles').text(totalArticles);
        $('#filteredArticles').text(filteredArticles);
        $('#uniqueLocations').text(uniqueLocations);
        
        var statusText = 'Showing ' + filteredArticles + ' of ' + totalArticles + ' articles';
        if (totalArticles !== filteredArticles) {
            statusText += ' (filtered)';
        }
        $('#mapStatus').text(statusText);
    },

    getUniqueLocations: function() {
        var uniqueLocations = {};
        
        for (var i = 0; i < NewsMap.filteredData.length; i++) {
            var article = NewsMap.filteredData[i];
            var locationKey = article.lat + ',' + article.lng;
            uniqueLocations[locationKey] = article.location;
        }
        
        return Object.values(uniqueLocations);
    },

    formatCategoryName: function(category) {
        if (!category) return 'General';
        return category.charAt(0).toUpperCase() + category.slice(1);
    },

    formatDate: function(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            var date = new Date(dateString);
            var now = new Date();
            var diffMs = now - date;
            var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDays === 0) return 'Today';
            if (diffDays === 1) return 'Yesterday';
            if (diffDays < 7) return diffDays + ' days ago';
            return date.toLocaleDateString();
        } catch (error) {
            return 'Invalid date';
        }
    },

    exportMapData: function() {
        try {
            var exportData = {
                totalArticles: NewsMap.newsData.length,
                filteredArticles: NewsMap.filteredData.length,
                uniqueLocations: NewsMap.getUniqueLocations().length,
                filters: NewsMap.currentFilters,
                exportDate: new Date().toISOString(),
                articles: NewsMap.filteredData.map(function(article) {
                    return {
                        title: article.title,
                        location: article.location,
                        lat: article.lat,
                        lng: article.lng,
                        category: article.category,
                        source: article.source && article.source.name,
                        publishedAt: article.publishedAt,
                        url: article.url
                    };
                })
            };
            
            var dataStr = JSON.stringify(exportData, null, 2);
            var dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            var exportFileDefaultName = 'news-map-data-' + new Date().toISOString().split('T')[0] + '.json';
            
            var linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            showAlert('success', 'Map data exported successfully');
        } catch (error) {
            console.error('Error exporting map data:', error);
            showAlert('danger', 'Failed to export map data');
        }
    }
};

// Initialize news map when page loads
$(document).ready(function() {
    if (window.location.pathname.indexOf('maps.html') !== -1 || 
        window.location.href.indexOf('maps.html') !== -1) {
        // Check if Leaflet is loaded
        if (typeof L !== 'undefined') {
            NewsMap.init();
        } else {
            console.error('❌ Leaflet library not loaded');
            showAlert('danger', 'Map library not loaded. Please check your internet connection.');
        }
    }
});

// Make NewsMap globally available
window.NewsMap = NewsMap;