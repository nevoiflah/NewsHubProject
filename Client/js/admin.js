// admin.js - Complete Admin Management System

// ============================================================================
// UTILITY FUNCTIONS - Ensure these are available
// ============================================================================

// Ensure Utils is available for admin functions
if (!window.Utils) {
    window.Utils = {
        sanitizeHtml: (html) => {
            if (!html) return '';
            return $('<div>').text(html).html();
        },

        formatDate: (dateString) => {
            if (!dateString) return 'Unknown';
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return 'Invalid Date';

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
            } catch (e) {
                return 'Unknown';
            }
        },

        truncateText: (text, maxLength = 150) => {
            if (!text) return '';
            return text.length > maxLength ?
                text.substring(0, maxLength) + '...' : text;
        }
    };
}

// Ensure showAlert is available
if (!window.showAlert) {
    window.showAlert = (type, message, duration = 5000) => {
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
    };
}

// ============================================================================
// ADMIN MANAGER - Main Admin Management System
// ============================================================================

const AdminManager = {
    currentSection: 'dashboard',

    // Initialize admin page
    init: () => {
        if (!Auth.requireAdmin()) return;

        AdminManager.setupEventListeners();
        AdminManager.loadDashboardData();
    },

    // Setup event listeners using jQuery
    setupEventListeners: () => {
        $('[data-section]').on('click', function (e) {
            e.preventDefault();
            const section = $(this).data('section');
            AdminManager.showSection(section);
        });
    },

    // Show admin section
    showSection: (sectionName) => {
        // Hide all sections
        $('.admin-section').hide();

        // Show selected section
        const $section = $('#' + sectionName);
        if ($section.length) {
            $section.show();
            AdminManager.currentSection = sectionName;

            // Load section data
            switch (sectionName) {
                case 'dashboard':
                    AdminManager.loadDashboardData();
                    break;
                case 'users':
                    AdminManager.loadUsersData();
                    break;
                case 'shared-articles':
                    AdminManager.loadSharedArticles();
                    break;
                case 'reports':
                    AdminManager.loadReportsData();
                    break;
                case 'analytics':
                    AdminManager.loadAnalyticsData();
                    break;
            }
        }

        // Update active menu item
        $('.list-group-item').removeClass('active');
        $(`[data-section="${sectionName}"]`).addClass('active');
    },

    // ============================================================================
    // DASHBOARD FUNCTIONS
    // ============================================================================

    // Load dashboard data 
    loadDashboardData: async () => {
        try {
            ('🔄 Loading dashboard data...');

            // Load system stats
            const statsPromise = $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/stats',
                cache: false,
                dataType: "json"
            });

            // Load users count
            const usersPromise = $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/users',
                cache: false,
                dataType: "json"
            });

            // Load shared articles count
            const sharedPromise = $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared',
                cache: false,
                dataType: "json"
            });

            // Load reports count
            const reportsPromise = $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports',
                cache: false,
                dataType: "json"
            });

            // Wait for all promises to resolve
            const [stats, users, shared, reports] = await Promise.all([
                statsPromise.catch(() => ({})),
                usersPromise.catch(() => []),
                sharedPromise.catch(() => []),
                reportsPromise.catch(() => [])
            ]);

            // Update dashboard stats - ensure arrays are valid and handle API response structure
            const usersArray = Array.isArray(users) ? users : [];
<<<<<<< HEAD
=======
            
            // Handle shared articles API response structure
            let sharedArray = [];
            if (shared && shared.success && Array.isArray(shared.articles)) {
                sharedArray = shared.articles;
            } else if (Array.isArray(shared)) {
                sharedArray = shared;
            }
            
            const reportsArray = Array.isArray(reports) ? reports : (reports.reports || []);
            
            $('#totalUsers').text(usersArray.length || 0);
            $('#activeUsers').text(usersArray.filter(u => !u.isLocked).length || 0);
            $('#sharedArticles').text(sharedArray.length || 0);
            $('#pendingReports').text(reportsArray.filter(r => !(r.isResolved || r.IsResolved)).length || 0);
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5

            // Handle shared articles API response structure
            let sharedArray = [];
            if (shared && shared.success && Array.isArray(shared.articles)) {
                sharedArray = shared.articles;
            } else if (Array.isArray(shared)) {
                sharedArray = shared;
            }

            const reportsArray = Array.isArray(reports) ? reports : (reports.reports || []);

            if (stats) {
                $('#totalUsers').text(stats.totalUsers || 0);
                $('#activeUsers').text(stats.activeUsersCount || 0);
                $('#sharedArticles').text(stats.sharedArticlesCount || 0);
                $('#pendingReports').text(stats.pendingReportsCount || 0);
            }

            ('✅ Dashboard data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading dashboard data:', error);
            // Set default values on error
            $('#totalUsers, #activeUsers, #sharedArticles, #pendingReports').text('0');
            showAlert('warning', 'Some dashboard data could not be loaded');
        }
    },

    // ============================================================================
    // USER MANAGEMENT FUNCTIONS
    // ============================================================================

    // Load users data 
    loadUsersData: async () => {
        try {
            ('🔄 Loading users data...');

            const users = await $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/users',
                cache: false,
                dataType: "json"
            });

            const $tbody = $('#usersTable');

            if (!users || users.length === 0) {
                $tbody.html('<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>');
                return;
            }

            const rows = users.map(user => {
                const statusBadge = user.isLocked ?
                    '<span class="badge bg-danger">Locked</span>' :
                    '<span class="badge bg-success">Active</span>';

                const adminBadge = user.isAdmin ?
                    '<span class="badge bg-primary ms-1">Admin</span>' : '';

                return `
                    <tr data-user-id="${user.id}">
                        <td>
                            <input type="checkbox" class="form-check-input user-checkbox" 
                                   value="${user.id}" onchange="AdminManager.handleUserSelection()">
                        </td>
                        <td>${Utils.sanitizeHtml(user.username)}${adminBadge}</td>
                        <td>${Utils.sanitizeHtml(user.email)}</td>
                        <td>${Utils.formatDate(user.registrationDate)}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-danger" onclick="AdminManager.deleteUser(${user.id})" title="Delete User">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            $tbody.html(rows);
            AdminManager.updateBulkOperationsUI();
            ('✅ Users data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading users:', error);
            $('#usersTable').html('<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>');
            showAlert('danger', 'Failed to load users data');
        }
    },

<<<<<<< HEAD
=======
    // Toggle user lock status 
    toggleUserLock: async (userId, isCurrentlyLocked) => {
        const action = isCurrentlyLocked ? 'unlock' : 'lock';
        const confirmMessage = `Are you sure you want to ${action} this user?`;
        
        if (!confirm(confirmMessage)) return;
        
        try {
            const response = await $.ajax({
                type: 'POST',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/${action}/${userId}`,
                cache: false,
                contentType: "application/json",
                dataType: "text"
            });
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5


    // Delete user 
    deleteUser: async (userId) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            const response = await $.ajax({
                type: 'DELETE',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/${userId}`,
                cache: false,
                contentType: "application/json",
                dataType: "text"
            });

            if (response && response.includes('successfully')) {
                showAlert('success', 'User deleted successfully');
                AdminManager.loadUsersData();
                AdminManager.loadDashboardData();
            } else {
                showAlert('danger', 'Failed to delete user');
            }
        } catch (error) {
            console.error('❌ Error deleting user:', error);
            showAlert('danger', 'Error deleting user');
        }
    },

    // Bulk operations for users
    handleUserSelection: () => {
        AdminManager.updateBulkOperationsUI();
    },

    updateBulkOperationsUI: () => {
        const $selectedCheckboxes = $('.user-checkbox:checked');
        const selectedCount = $selectedCheckboxes.length;
        const totalCount = $('.user-checkbox').length;

        // Update select all checkbox
        const $selectAllCheckbox = $('#selectAllUsers');
        if (selectedCount === 0) {
            $selectAllCheckbox.prop('indeterminate', false).prop('checked', false);
        } else if (selectedCount === totalCount) {
            $selectAllCheckbox.prop('indeterminate', false).prop('checked', true);
        } else {
            $selectAllCheckbox.prop('indeterminate', true);
        }

        // Update bulk operations panel
        const $bulkPanel = $('#bulkOperationsPanel');
        const $selectedCountSpan = $('#selectedUsersCount');

        if (selectedCount > 0) {
            $selectedCountSpan.text(selectedCount);
            $bulkPanel.show();
        } else {
            $bulkPanel.hide();
        }
    },

    // Select all users
    selectAllUsers: (checked) => {
        $('.user-checkbox').prop('checked', checked);
        AdminManager.updateBulkOperationsUI();
    },

    // Clear selection
    clearSelection: () => {
        $('.user-checkbox').prop('checked', false);
        $('#selectAllUsers').prop('checked', false).prop('indeterminate', false);
        AdminManager.updateBulkOperationsUI();
    },

    // Perform bulk operations
    performBulkOperation: async (operation) => {
        const $selectedCheckboxes = $('.user-checkbox:checked');
        const selectedUserIds = $selectedCheckboxes.map(function () {
            return parseInt($(this).val());
        }).get();

        if (selectedUserIds.length === 0) {
            showAlert('warning', 'Please select users first');
            return;
        }

        const confirmMessage = `Are you sure you want to ${operation} ${selectedUserIds.length} user(s)?`;
        if (!confirm(confirmMessage)) return;

        try {
            let successCount = 0;
            let failCount = 0;

            showAlert('info', `Processing bulk ${operation} operation...`);

            // Process each user individually
            for (const userId of selectedUserIds) {
                try {
                    let endpoint, method;

                    switch (operation) {
<<<<<<< HEAD

=======
                        case 'lock':
                            endpoint = `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/lock/${userId}`;
                            method = 'POST';
                            break;
                        case 'unlock':
                            endpoint = `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/unlock/${userId}`;
                            method = 'POST';
                            break;
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                        case 'delete':
                            endpoint = `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/${userId}`;
                            method = 'DELETE';
                            break;
                        default:
                            throw new Error('Invalid operation');
                    }

                    await $.ajax({
                        type: method,
                        url: endpoint,
                        cache: false,
                        contentType: "application/json",
                        dataType: "text"
                    });

                    successCount++;
                } catch (error) {
                    failCount++;
                    console.error(`Error ${operation}ing user ${userId}:`, error);
                }
            }

            // Show results
            if (successCount > 0 && failCount === 0) {
                showAlert('success', `Successfully ${operation}ed all ${successCount} user(s)`);
            } else if (successCount > 0 && failCount > 0) {
                showAlert('warning', `${operation}ed ${successCount} user(s), failed ${failCount}`);
            } else {
                showAlert('danger', `Failed to ${operation} any users`);
            }

            // Reload data and clear selection
            AdminManager.loadUsersData();
            AdminManager.loadDashboardData();
            AdminManager.clearSelection();

        } catch (error) {
            console.error(`❌ Error performing bulk ${operation}:`, error);
            showAlert('danger', `Error performing bulk ${operation}`);
        }
    },

    // ============================================================================
    // SHARED ARTICLES MANAGEMENT FUNCTIONS
    // ============================================================================

    // Load shared articles
    loadSharedArticles: async () => {
        try {
<<<<<<< HEAD
            ('🔄 Loading shared articles...');

=======
            console.log('🔄 Loading shared articles...');
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            const response = await $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared',
                cache: false,
                dataType: "json"
            });

            const $tbody = $('#sharedArticlesTable');
<<<<<<< HEAD

            // Handle the API response structure: { success: true, articles: [...], count: N }
            let articlesArray = [];

            if (response && response.success && Array.isArray(response.articles)) {
                articlesArray = response.articles;
                (`📊 Found ${articlesArray.length} shared articles`);
            } else if (Array.isArray(response)) {
                // Fallback for direct array response
                articlesArray = response;
                (`📊 Found ${articlesArray.length} shared articles (direct array)`);
            }

=======
            
            // Handle the API response structure: { success: true, articles: [...], count: N }
            let articlesArray = [];
            
            if (response && response.success && Array.isArray(response.articles)) {
                articlesArray = response.articles;
                console.log(`📊 Found ${articlesArray.length} shared articles`);
            } else if (Array.isArray(response)) {
                // Fallback for direct array response
                articlesArray = response;
                console.log(`📊 Found ${articlesArray.length} shared articles (direct array)`);
            }
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            if (!articlesArray || articlesArray.length === 0) {
                $tbody.html('<tr><td colspan="6" class="text-center text-muted">No shared articles found</td></tr>');
                return;
            }

            const rows = articlesArray.map(article => {
                const title = article.articleTitle || article.title || 'Untitled';
                const username = article.username || article.sharedBy || 'Unknown';
                const commentCount = article.commentsCount || article.commentCount || 0;
<<<<<<< HEAD

=======
                
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                return `
                    <tr data-article-id="${article.id}">
                        <td>${article.id}</td>
                        <td>
                            <div style="max-width: 300px;">
                                <strong>${Utils.sanitizeHtml(title.substring(0, 50))}${title.length > 50 ? '...' : ''}</strong>
                                ${article.url ? `<br><small class="text-muted">${Utils.sanitizeHtml(article.url.substring(0, 40))}...</small>` : ''}
                            </div>
                        </td>
                        <td>${Utils.sanitizeHtml(username)}</td>
                        <td>
                            <span class="badge bg-info">${commentCount}</span>
                            ${commentCount > 0 ? `<button class="btn btn-sm btn-outline-info ms-1" onclick="AdminManager.viewComments(${article.id})" title="View Comments">
                                <i class="fas fa-eye"></i>
                            </button>` : ''}
                        </td>
                        <td>${Utils.formatDate(article.sharedAt || article.createdAt)}</td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="AdminManager.viewSharedArticle(${article.id})" title="View Article">
                                    <i class="fas fa-eye"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="AdminManager.deleteSharedArticle(${article.id})" title="Delete Article">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            $tbody.html(rows);
            ('✅ Shared articles loaded successfully');
        } catch (error) {
            console.error('❌ Error loading shared articles:', error);
            $('#sharedArticlesTable').html('<tr><td colspan="6" class="text-center text-danger">Failed to load shared articles</td></tr>');
            showAlert('danger', 'Failed to load shared articles');
        }
    },

    // View shared article details
    viewSharedArticle: async (articleId) => {
        try {
            const article = await $.ajax({
                type: 'GET',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared/${articleId}`,
                cache: false,
                dataType: "json"
            });

            if (article && article.url) {
                window.open(article.url, '_blank');
            } else {
                showAlert('warning', 'Article URL not available');
            }
        } catch (error) {
            console.error('❌ Error viewing article:', error);
            showAlert('danger', 'Error loading article details');
        }
    },

    // Delete shared article
    deleteSharedArticle: async (articleId) => {
        if (!confirm('Are you sure you want to delete this shared article? This will also delete all comments.')) return;

        try {
            const response = await $.ajax({
                type: 'DELETE',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared/${articleId}`,
                cache: false,
                contentType: "application/json",
                dataType: "text"
            });

            if (response && response.includes('successfully')) {
                showAlert('success', 'Shared article deleted successfully');
                AdminManager.loadSharedArticles();
                AdminManager.loadDashboardData();
            } else {
                showAlert('danger', 'Failed to delete shared article');
            }
        } catch (error) {
            console.error('❌ Error deleting shared article:', error);
            showAlert('danger', 'Error deleting shared article');
        }
    },

    // View comments for shared article
    viewComments: async (articleId) => {
        try {
            const response = await $.ajax({
                type: 'GET',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared/${articleId}/comments`,
                cache: false,
                dataType: "json"
            });

            const $container = $('#commentsContainer');
<<<<<<< HEAD

            // Handle both direct array and object response formats
            const comments = Array.isArray(response) ? response : (response.comments || []);

=======
            
            // Handle both direct array and object response formats
            const comments = Array.isArray(response) ? response : (response.comments || []);
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            if (!comments || comments.length === 0) {
                $container.html('<p class="text-muted">No comments found for this article.</p>');
            } else {
                const commentsHtml = comments.map(comment => `
                    <div class="border rounded p-3 mb-3" data-comment-id="${comment.id}">
                        <div class="d-flex justify-content-between align-items-start">
                            <div>
                                <strong>${Utils.sanitizeHtml(comment.username || 'Anonymous')}</strong>
                                <small class="text-muted ms-2">${Utils.formatDate(comment.createdAt)}</small>
                            </div>
                            <button class="btn btn-sm btn-outline-danger" onclick="AdminManager.deleteComment(${comment.id}, ${articleId})" title="Delete Comment">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <p class="mt-2 mb-0">${Utils.sanitizeHtml(comment.content || comment.comment)}</p>
                    </div>
                `).join('');

                $container.html(commentsHtml);
            }

            // Show the modal
            const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
            modal.show();

        } catch (error) {
            console.error('❌ Error loading comments:', error);
            showAlert('danger', 'Error loading comments');
        }
    },

    // Delete comment
    deleteComment: async (commentId, articleId) => {
        if (!confirm('Are you sure you want to delete this comment?')) return;

        try {
            // Get current user ID (admin should be logged in)
            const currentUser = Auth.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                showAlert('danger', 'Authentication required to delete comments');
                return;
            }

            const response = await $.ajax({
                type: 'DELETE',
<<<<<<< HEAD
                url: `http://localhost:5121/api/shared/${articleId}/comments/${commentId}?userId=${currentUser.id}`,
=======
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared/${articleId}/comments/${commentId}?userId=${currentUser.id}`,
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                cache: false,
                contentType: "application/json",
                dataType: "json"
            });

            // Refresh the page after any response to ensure clean state
            window.location.reload();
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            // Refresh the page even on error to ensure clean state
            window.location.reload();
        }
    },

    // ============================================================================
    // REPORTS MANAGEMENT FUNCTIONS
    // ============================================================================

    // Load reports data 
    loadReportsData: async () => {
        try {
<<<<<<< HEAD
            ('🔄 Loading reports data...');

=======
            console.log('🔄 Loading reports data...');
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            const response = await $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports',
                cache: false,
                dataType: "json"
            });

            const $tbody = $('#reportsTable');
<<<<<<< HEAD

            // Handle both direct array and object response formats
            const reportsArray = Array.isArray(response) ? response : (response.reports || []);

            ('📋 Reports data received:', reportsArray);
            ('📋 First report structure:', reportsArray[0]);

=======
            
            // Handle both direct array and object response formats
            const reportsArray = Array.isArray(response) ? response : (response.reports || []);
            
            console.log('📋 Reports data received:', reportsArray);
            console.log('📋 First report structure:', reportsArray[0]);
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            if (!reportsArray || reportsArray.length === 0) {
                $tbody.html('<tr><td colspan="7" class="text-center text-muted">No reports found</td></tr>');
                return;
            }

            const rows = reportsArray.map(report => {
                // Handle both PascalCase and camelCase property names
                const reportId = report.id || report.Id || 0;
                const isResolved = report.isResolved || report.IsResolved || false;
                const reason = report.reason || report.Reason || 'No reason provided';
                const reporterUsername = report.reporterUsername || report.ReporterUsername || 'Unknown';
                const contentType = report.contentType || report.ContentType || 'Article';
                const reportedAt = report.reportedAt || report.ReportedAt || report.createdAt;
<<<<<<< HEAD

                const statusBadge = isResolved ?
                    '<span class="badge bg-success">Resolved</span>' :
                    '<span class="badge bg-warning">Pending</span>';

=======
                
                const statusBadge = isResolved ? 
                    '<span class="badge bg-success">Resolved</span>' : 
                    '<span class="badge bg-warning">Pending</span>';
                
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                // Clean up the reason by removing prefixes
                let cleanReason = reason;
                if (cleanReason.startsWith('SharedArticle:')) {
                    cleanReason = cleanReason.substring('SharedArticle:'.length);
                } else if (cleanReason.startsWith('Comment:')) {
                    cleanReason = cleanReason.substring('Comment:'.length);
                }
<<<<<<< HEAD

=======
                
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                return `
                    <tr data-report-id="${reportId}">
                        <td>${reportId}</td>
                        <td>${Utils.sanitizeHtml(reporterUsername)}</td>
                        <td>${Utils.sanitizeHtml(contentType)}</td>
                        <td>${Utils.sanitizeHtml(cleanReason)}</td>
                        <td>${Utils.formatDate(reportedAt)}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-info" onclick="AdminManager.viewReport(${reportId})" title="View Report">
                                    <i class="fas fa-eye"></i>
                                </button>
                                ${!isResolved ? `
                                    <button class="btn btn-outline-success" onclick="AdminManager.resolveReport(${reportId})" title="Resolve Report">
                                        <i class="fas fa-check"></i>
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline-danger" onclick="AdminManager.deleteReport(${reportId})" title="Delete Report">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');

            $tbody.html(rows);
            ('✅ Reports data loaded successfully');
        } catch (error) {
            console.error('❌ Error loading reports:', error);
            $('#reportsTable').html('<tr><td colspan="7" class="text-center text-danger">Failed to load reports</td></tr>');
            showAlert('danger', 'Failed to load reports');
        }
    },

    // View report details
    viewReport: async (reportId) => {
        try {
<<<<<<< HEAD
            ('👁️ Viewing report ID:', reportId);

=======
            console.log('👁️ Viewing report ID:', reportId);
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            const response = await $.ajax({
                type: 'GET',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports/${reportId}`,
                cache: false,
                dataType: "json"
            });

<<<<<<< HEAD
            ('👁️ Report API response:', response);

            // Handle response format - could be direct object or wrapped
            const report = response.report || response;

=======
            console.log('👁️ Report API response:', response);
            
            // Handle response format - could be direct object or wrapped
            const report = response.report || response;
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            // Handle both PascalCase and camelCase property names
            const reportIdValue = report.id || report.Id || reportId;
            const reporterUsername = report.reporterUsername || report.ReporterUsername || 'Unknown';
            const contentType = report.contentType || report.ContentType || 'Article';
            const reason = report.reason || report.Reason || 'No reason provided';
            const createdAt = report.createdAt || report.reportedAt || report.ReportedAt || new Date();
            const isResolved = report.isResolved || report.IsResolved || false;
            const contentTitle = report.contentTitle || report.ContentTitle || '';

            // Clean up the reason by removing prefixes
            let cleanReason = reason;
            if (cleanReason.startsWith('SharedArticle:')) {
                cleanReason = cleanReason.substring('SharedArticle:'.length);
            } else if (cleanReason.startsWith('Comment:')) {
                cleanReason = cleanReason.substring('Comment:'.length);
            }

            const details = `Report Details:

ID: ${reportIdValue}
Reporter: ${reporterUsername}
Content Type: ${contentType}
${contentTitle ? `Content Title: ${contentTitle}` : ''}
Reason: ${cleanReason}
Date: ${Utils.formatDate(createdAt)}
Status: ${isResolved ? 'Resolved' : 'Pending'}`;

            alert(details);
        } catch (error) {
            console.error('❌ Error viewing report:', error);
            console.error('❌ Error details:', error.responseText);
            showAlert('danger', 'Error loading report details');
        }
    },

    // Resolve report 
    resolveReport: async (reportId) => {
<<<<<<< HEAD
        ('🔧 Resolving report ID:', reportId, 'Type:', typeof reportId);

=======
        console.log('🔧 Resolving report ID:', reportId, 'Type:', typeof reportId);
        
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
        if (!confirm('Mark this report as resolved?')) return;

        try {
            // Get current admin user ID
            const currentUser = Auth.getCurrentUser();
            if (!currentUser || !currentUser.id) {
                showAlert('danger', 'Authentication required to resolve reports');
                return;
            }

            const response = await $.ajax({
                type: 'PUT',
<<<<<<< HEAD
                url: `http://localhost:5121/api/Reports/${reportId}/resolve?adminUserId=${currentUser.id}`,
=======
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports/${reportId}/resolve?adminUserId=${currentUser.id}`,
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                data: JSON.stringify({
                    IsResolved: true
                }),
                cache: false,
                contentType: "application/json",
                dataType: "json"
            });

            if (response && response.success) {
                // Show success message briefly before refreshing
                showAlert('success', response.message || 'Report resolved successfully');
                // Refresh page after a brief moment to show the success message
                setTimeout(() => {
                    window.location.reload();
                }, 500); // Half a second delay
            } else {
                showAlert('danger', response.message || 'Failed to resolve report');
            }
        } catch (error) {
            console.error('❌ Error resolving report:', error);
            showAlert('danger', 'Error resolving report');
        }
    },

    // Delete report 
    deleteReport: async (reportId) => {
        if (!confirm('Are you sure you want to delete this report?')) return;

        try {
            const response = await $.ajax({
                type: 'DELETE',
                url: `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports/${reportId}`,
                cache: false,
                contentType: "application/json",
                dataType: "text"
            });

            if (response && response.includes('successfully')) {
                showAlert('success', 'Report deleted successfully');
                AdminManager.loadReportsData();
                AdminManager.loadDashboardData();
            } else {
                showAlert('danger', 'Failed to delete report');
            }
        } catch (error) {
            console.error('❌ Error deleting report:', error);
            showAlert('danger', 'Error deleting report');
        }
    },

    // ============================================================================
    // ANALYTICS FUNCTIONS
    // ============================================================================

    // Load analytics data 
    loadAnalyticsData: async () => {
        try {
<<<<<<< HEAD
            ('🔄 Loading analytics data...');

=======
            console.log('🔄 Loading analytics data...');
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            // Load all analytics charts
            await Promise.all([
                AdminManager.loadLoginChart(),
                AdminManager.loadActivityChart(),
                AdminManager.loadRegistrationChart(),
                AdminManager.loadContentChart()
            ]);
<<<<<<< HEAD

            ('✅ All analytics data loaded successfully');
=======
            
            console.log('✅ All analytics data loaded successfully');
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
        } catch (error) {
            console.error('❌ Error loading analytics:', error);
            AdminManager.renderSampleCharts();
        }
    },

    loadLoginChart: async () => {
        try {
            const data = await $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/analytics/logins',
                cache: false,
                dataType: "json"
            });
            AdminManager.renderLoginChart(data);
        } catch (error) {
            showAlert('danger', 'Failed to load login analytics data.');
        }
    },

    loadActivityChart: async () => {
        try {
            const data = await $.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/analytics/activity',
                cache: false,
                dataType: "json"
            });
            AdminManager.renderActivityChart(data);
        } catch (error) {
            console.error('❌ Failed to load user activity analytics:', error);
            AdminManager.renderActivityChart({
                labels: ['Active Users', 'Locked Users', 'New Users'],
                values: [0, 0, 0],
                title: 'User Activity (Error)'
            });
        }
    },

    loadRegistrationChart: async () => {
        try {
            const data = await $.ajax({
                type: 'GET',
<<<<<<< HEAD
                url: 'http://localhost:5121/api/Admin/analytics/registrations?days=14',
=======
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/analytics/registrations?days=14',
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                cache: false,
                dataType: "json"
            });
            AdminManager.renderRegistrationChart(data);
        } catch (error) {
            console.error('❌ Failed to load registration analytics:', error);
            AdminManager.renderRegistrationChart({
                labels: [],
                values: [],
                title: 'Daily Registrations (Error)'
            });
        }
    },

    loadContentChart: async () => {
        try {
            const data = await $.ajax({
                type: 'GET',
<<<<<<< HEAD
                url: 'http://localhost:5121/api/Admin/analytics/content?days=7',
=======
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/analytics/content?days=7',
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
                cache: false,
                dataType: "json"
            });
            AdminManager.renderContentChart(data);
        } catch (error) {
            console.error('❌ Failed to load content analytics:', error);
            AdminManager.renderContentChart({
                labels: [],
                datasets: [],
                title: 'Content Activity (Error)'
            });
        }
    },

    renderSampleCharts: () => {
<<<<<<< HEAD
        ('📊 Rendering sample charts as fallback...');

=======
        console.log('📊 Rendering sample charts as fallback...');
        
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
        AdminManager.renderLoginChart({
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            values: [0, 0, 0, 0, 0, 0, 0],
            title: 'Daily Logins (No Data)'
        });

        AdminManager.renderActivityChart({
            labels: ['Active Users', 'Locked Users', 'New Users'],
            values: [0, 0, 0],
            title: 'User Activity (No Data)'
        });

        AdminManager.renderRegistrationChart({
            labels: [],
            values: [],
            title: 'Daily Registrations (No Data)'
        });

        AdminManager.renderContentChart({
            labels: [],
            datasets: [],
            title: 'Content Activity (No Data)'
        });
    },

    // Render charts using Chart.js
    renderLoginChart: (data) => {
        const ctx = document.getElementById('loginChart');
        if (!ctx || !data) return;

        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'Daily Logins',
                    data: data.values || [],
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.1,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                }
            }
        });
    },

    renderActivityChart: (data) => {
        const ctx = document.getElementById('activityChart');
        if (!ctx || !data) return;

        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels || [],
                datasets: [{
                    data: data.values || [],
                    backgroundColor: [
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom'
                    }
                }
            }
        });
    },

    renderRegistrationChart: (data) => {
        const ctx = document.getElementById('registrationChart');
        if (!ctx || !data) return;

        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels || [],
                datasets: [{
                    label: 'New Registrations',
                    data: data.values || [],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgb(54, 162, 235)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: data.title || 'Daily Registrations'
                    }
                }
            }
        });
    },

    renderContentChart: (data) => {
        const ctx = document.getElementById('contentChart');
        if (!ctx || !data) return;

        // Destroy existing chart if it exists
        if (ctx.chart) {
            ctx.chart.destroy();
        }

        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels || [],
                datasets: data.datasets || []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: 2,
                layout: {
                    padding: 10
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: data.title || 'Content Activity'
                    }
                }
            }
        });

        // Display overall stats if provided
        if (data.overallStats) {
            // Remove any existing stats before adding new ones
            $('#contentChart').parent().find('.content-stats').remove();
<<<<<<< HEAD

=======
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            const statsHtml = `
                <div class="row mt-3 content-stats">
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h4 mb-0 text-primary">${data.overallStats.totalSharedArticles}</div>
                            <small class="text-muted">Total Shared</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h4 mb-0 text-danger">${data.overallStats.totalReports}</div>
                            <small class="text-muted">Total Reports</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h4 mb-0 text-warning">${data.overallStats.pendingReports}</div>
                            <small class="text-muted">Pending Reports</small>
                        </div>
                    </div>
                    <div class="col-3">
                        <div class="text-center">
                            <div class="h4 mb-0 text-success">${data.overallStats.sharedArticlesToday}</div>
                            <small class="text-muted">Today's Shares</small>
                        </div>
                    </div>
                </div>
            `;
            $('#contentChart').parent().append(statsHtml);
        }
    },

    // ============================================================================
    // REPORT GENERATION FUNCTIONS
    // ============================================================================

    // Generate and download admin report 
    generateReport: async () => {
        try {
            showAlert('info', 'Generating admin report...');

            const promises = [];

            // Create promises for each API call with error handling
            promises.push($.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/stats',
                cache: false,
                dataType: "json"
            }).catch(() => ({})));

            promises.push($.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Admin/users',
                cache: false,
                dataType: "json"
            }).catch(() => []));

            promises.push($.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/Reports',
                cache: false,
                dataType: "json"
            }).catch(() => []));

            promises.push($.ajax({
                type: 'GET',
                url: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/shared',
                cache: false,
                dataType: "json"
            }).catch(() => []));

            const [stats, users, reports, shared] = await Promise.all(promises);

            // Ensure all data is arrays and handle API response structures
            const usersArray = Array.isArray(users) ? users : [];
            const reportsArray = Array.isArray(reports) ? reports : [];
<<<<<<< HEAD

=======
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            // Handle shared articles API response structure
            let sharedArray = [];
            if (shared && shared.success && Array.isArray(shared.articles)) {
                sharedArray = shared.articles;
            } else if (Array.isArray(shared)) {
                sharedArray = shared;
            }
<<<<<<< HEAD

=======
            
>>>>>>> afe453e67e2ed02a713ac80076bc6e4e406184c5
            const currentUser = Auth.getCurrentUser();
            const reportData = {
                generatedAt: new Date().toISOString(),
                generatedBy: currentUser.username || 'Unknown Admin',
                summary: {
                    totalUsers: usersArray.length,
                    activeUsers: usersArray.filter(u => !u.isLocked).length,
                    lockedUsers: usersArray.filter(u => u.isLocked).length,
                    adminUsers: usersArray.filter(u => u.isAdmin).length,
                    totalSharedArticles: sharedArray.length,
                    totalReports: reportsArray.length,
                    pendingReports: reportsArray.filter(r => !r.isResolved).length,
                    resolvedReports: reportsArray.filter(r => r.isResolved).length
                },
                systemStats: stats,
                userBreakdown: {
                    byRegistrationMonth: AdminManager.groupUsersByMonth(usersArray),
                    recentUsers: usersArray.filter(u => new Date(u.registrationDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
                },
                contentStats: {
                    sharedArticlesCount: sharedArray.length,
                    reportsCount: reportsArray.length
                }
            };

            const dataStr = JSON.stringify(reportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

            const exportFileDefaultName = `admin-report-${new Date().toISOString().split('T')[0]}.json`;

            // Create download link
            const $linkElement = $('<a>').attr({
                href: dataUri,
                download: exportFileDefaultName
            });

            // Trigger download
            $linkElement[0].click();

            showAlert('success', 'Admin report downloaded successfully');
        } catch (error) {
            console.error('❌ Error generating report:', error);
            showAlert('danger', 'Failed to generate admin report');
        }
    },

    // Helper function to group users by registration month
    groupUsersByMonth: (users) => {
        const monthGroups = {};
        users.forEach(user => {
            if (user.registrationDate) {
                const date = new Date(user.registrationDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                monthGroups[monthKey] = (monthGroups[monthKey] || 0) + 1;
            }
        });
        return monthGroups;
    }
};

// ============================================================================
// INITIALIZATION
// ============================================================================

// Initialize when page loads
$(document).ready(function () {
    // Small delay to ensure all dependencies are loaded
    setTimeout(() => {
        ('🚀 Initializing Admin Manager...');
        AdminManager.init();
    }, 100);
});