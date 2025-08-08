// share.js - Full Community Features Implementation with Inline Comments
const ShareManager = {
    sharedContent: [],
    filteredContent: [],
    blockedUsers: [],
    followingUsers: [],
    currentPage: 1,
    itemsPerPage: 10,
    baseUrl: 'https://proj.ruppin.ac.il/cgroup17/test2/tar1/api',

    // Initialize the shared content page
    init: function() {
        this.setupEventListeners();
        this.loadSharedContent();
        this.loadBlockedUsers();
        this.loadFollowingUsers();
        this.loadFollowingStats();
    },

    // Setup event listeners
    setupEventListeners: function() {
        // Share form submission
        $('#shareForm').on('submit', this.handleShareSubmission.bind(this));
        $('#submitShare').on('click', this.handleShareSubmission.bind(this));
        
        // URL metadata fetching
        $('#fetchMetadata').on('click', this.fetchArticleMetadata.bind(this));
        $('#articleUrl').on('input', this.debounce(this.handleUrlInput.bind(this), 1000));
        
        // Filter controls
        $('#userFilter').on('input', this.debounce(this.applyFilters.bind(this), 300));
        $('#sortShared').on('change', this.applyFilters.bind(this));
        $('#followingOnlyFilter').on('change', this.applyFilters.bind(this));
        $('#applyFilters').on('click', this.applyFilters.bind(this));
        
        // Clear filters button
        $('#clearFilters').on('click', this.clearAllFilters.bind(this));
        
        // Pagination
        $(document).on('click', '.pagination-btn', this.handlePagination.bind(this));
        
        // Article interactions
        $(document).on('click', '.like-btn', this.handleLikeArticle.bind(this));
        $(document).on('click', '.comment-btn', this.handleShowComments.bind(this));
        $(document).on('click', '.save-article-btn', this.handleSaveArticle.bind(this));
        $(document).on('click', '.report-content-btn', this.handleReportContent.bind(this));
        $(document).on('click', '.follow-user-btn', this.handleFollowUser.bind(this));
        $(document).on('click', '.unfollow-user-btn', this.handleUnfollowUser.bind(this));
        $(document).on('click', '.block-user-btn', this.handleBlockUser.bind(this));
        $(document).on('click', '.delete-shared-btn', this.handleDeleteShared.bind(this));
        
        // Comment interactions - INLINE VERSION
        $(document).on('click', '.submit-comment-inline-btn', this.handleSubmitCommentInline.bind(this));
        $(document).on('click', '.delete-comment-inline-btn', this.handleDeleteCommentInline.bind(this));
        $(document).on('click', '.toggle-comments-btn', function() {
            const $btn = $(this);
            const $commentsList = $btn.closest('.comments-section').find('.comments-list, .add-comment-form');
            $commentsList.slideToggle();
            const isVisible = $commentsList.is(':visible');
            $btn.html(isVisible ? '<i class="fas fa-chevron-up"></i> Hide' : '<i class="fas fa-chevron-down"></i> Show');
        });
    },

    // Debounce utility function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Fetch article metadata
    fetchArticleMetadata: function() {
        const url = $('#articleUrl').val().trim();
        if (!url || !this.isValidUrl(url)) {
            showAlert('warning', 'Please enter a valid URL');
            return;
        }

        const $btn = $('#fetchMetadata');
        const originalText = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin me-1"></i>Fetching...').prop('disabled', true);

        // For demo purposes, extract basic info from URL
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            
            // Auto-fill basic information
            $('#articleSource').val(domain);
            $('#articleTitle').val('Article from ' + domain);
            
            // Show preview
            this.showMetadataPreview({
                title: 'Article from ' + domain,
                description: 'Click to read the full article',
                source: domain,
                image: null
            });
            
            showAlert('info', 'Metadata fetched! Please review and edit as needed.');
        } catch (error) {
            showAlert('warning', 'Could not fetch metadata. Please fill in the details manually.');
        } finally {
            $btn.html(originalText).prop('disabled', false);
        }
    },

    // Handle URL input changes
    handleUrlInput: function() {
        const url = $('#articleUrl').val().trim();
        if (url && this.isValidUrl(url)) {
            this.fetchArticleMetadata();
        }
    },

    // Show metadata preview
    showMetadataPreview: function(metadata) {
        const $preview = $('#metadataPreview');
        
        $preview.removeClass('d-none').html(`
            <hr>
            <h6>Preview:</h6>
            <div class="card">
                <div class="card-body">
                    <h6 class="card-title" id="previewTitle">${this.sanitizeHtml(metadata.title || 'No title')}</h6>
                    <p class="card-text" id="previewDescription">${this.sanitizeHtml(metadata.description || 'No description')}</p>
                    <small class="text-muted" id="previewSource">${this.sanitizeHtml(metadata.source || 'Unknown source')}</small>
                </div>
            </div>
        `);
    },

    // Handle share form submission
    handleShareSubmission: function(e) {
        if (e) e.preventDefault();

        const url = $('#articleUrl').val().trim();
        const comment = $('#shareComment').val().trim();
        const tags = $('#shareTags').val().trim();
        const userId = localStorage.getItem('userId');

        if (!url || !this.isValidUrl(url)) {
            showAlert('warning', 'Please enter a valid article URL');
            return;
        }

        if (!comment) {
            showAlert('warning', 'Please add a comment about why you\'re sharing this article');
            return;
        }

        const $btn = $('#submitShare');
        const originalText = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin me-2"></i>Sharing...').prop('disabled', true);

        const shareData = {
            url: url,
            comment: comment,
            tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
            articleTitle: $('#articleTitle').val().trim() || null,
            articleDescription: $('#articleDescription').val().trim() || null,
            articleSource: $('#articleSource').val().trim() || null,
            articleImageUrl: $('#articleImage').val().trim() || null
        };

        ajaxCall(
            'POST',
            `${this.baseUrl}/shared?userId=${userId}`,
            JSON.stringify(shareData),
            function(response) {
                if (response && response.success) {
                    showAlert('success', 'Article shared successfully!');
                    
                    // Track activity for sharing
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        ajaxCall(
                            'POST',
                            `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/activity/${userId}`,
                            null,
                            function() {
                                // Trigger avatar update after activity change
                                if (window.triggerAvatarUpdate) {
                                    window.triggerAvatarUpdate();
                                }
                            },
                            function(xhr, status, error) {
                                console.warn('Failed to track activity:', error);
                            }
                        );
                    }
                    
                    // Reset form
                    $('#shareForm')[0].reset();
                    $('#metadataPreview').addClass('d-none');
                    bootstrap.Modal.getInstance($('#shareModal')[0]).hide();
                    
                    // Refresh shared content
                    setTimeout(() => ShareManager.loadSharedContent(), 1000);
                } else {
                    showAlert('danger', response.message || 'Failed to share article');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Share submission error:', error);
                showAlert('danger', 'Failed to share article. Please try again.');
            }
        );
    },

    // Load shared content
    loadSharedContent: function() {
        console.log('📰 Loading shared content...');
        const userId = localStorage.getItem('userId');

        ajaxCall(
            'GET',
            `${this.baseUrl}/shared?userId=${userId || ''}`,
            null,
            function(response) {
                if (response && response.success) {
                    ShareManager.sharedContent = response.articles || [];
                    ShareManager.filteredContent = [...ShareManager.sharedContent];
                    ShareManager.applyFilters();
                    ShareManager.updateFilterIndicators();
                } else {
                    ShareManager.showErrorMessage('Failed to load shared content');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading shared content:', error);
                ShareManager.showErrorMessage('Failed to load shared content');
            }
        );
    },

    // Load blocked users
    loadBlockedUsers: function() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        ajaxCall(
            'GET',
            `${this.baseUrl}/users/blocked?userId=${userId}`,
            null,
            function(response) {
                if (response && response.success) {
                    ShareManager.blockedUsers = response.blockedUsers || [];
                    ShareManager.displayBlockedUsers();
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading blocked users:', error);
            }
        );
    },

    // Load following users
    loadFollowingUsers: function() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        ajaxCall(
            'GET',
            `${this.baseUrl}/users/following?userId=${userId}`,
            null,
            function(response) {
                if (response && response.success) {
                    ShareManager.followingUsers = response.following || [];
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading following users:', error);
            }
        );
    },

    // Load following stats
    loadFollowingStats: function() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        ajaxCall(
            'GET',
            `${this.baseUrl}/users/following-stats?userId=${userId}`,
            null,
            function(response) {
                if (response && response.success) {
                    ShareManager.displayFollowingStats(response.stats);
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading following stats:', error);
            }
        );
    },

    // Handle like article
    handleLikeArticle: function(e) {
        e.preventDefault();
        const $btn = $(e.currentTarget);
        const shareId = $btn.closest('.card').data('share-id');
        const userId = window.Auth.getCurrentUser()?.id;
        
        if (!userId) {
            showAlert('error', 'Please log in to like articles');
            return;
        }

        // Fire AJAX call in background and refresh page immediately
        ajaxCall(
            'POST',
            `${this.baseUrl}/shared/${shareId}/like?userId=${userId}`,
            null
        );
        
        // Refresh page immediately
        location.reload();
    },

    // UPDATED: Show comments - now inline instead of modal
    handleShowComments: function(e) {
        const $btn = $(e.currentTarget);
        const articleId = $btn.data('article-id');
        const $card = $btn.closest('.card');
        
        // Check if comments are already shown
        const $existingComments = $card.find('.comments-section');
        if ($existingComments.length > 0) {
            // Toggle visibility
            $existingComments.slideToggle();
            return;
        }
        
        // Load and show comments inline
        this.loadAndShowCommentsInline(articleId, $card);
    },

    // NEW: Load and show comments inline under the card
    loadAndShowCommentsInline: function(articleId, $card) {
        const userId = localStorage.getItem('userId');
        
        // Show loading
        const $loadingHtml = $(`
            <div class="comments-section border-top pt-3 mt-3">
                <div class="text-center">
                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                    <span class="ms-2 text-muted">Loading comments...</span>
                </div>
            </div>
        `);
        $card.find('.card-body').append($loadingHtml);
        
        ajaxCall(
            'GET',
            `${this.baseUrl}/shared/${articleId}/comments?userId=${userId}`,
            null,
            function(response) {
                if (response && response.success) {
                    ShareManager.showCommentsInline(articleId, response.comments || [], $card);
                } else {
                    $loadingHtml.html('<div class="alert alert-warning">Failed to load comments</div>');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error loading comments:', error);
                $loadingHtml.html('<div class="alert alert-danger">Error loading comments</div>');
            }
        );
    },

    // NEW: Show comments inline under the article card
    showCommentsInline: function(articleId, comments, $card) {
        const userId = localStorage.getItem('userId');
        
        // Remove loading indicator
        $card.find('.comments-section').remove();
        
        // Build comments HTML
        const commentsHtml = comments.map(comment => `
            <div class="comment-item d-flex mb-3 p-2 bg-light rounded">
                <div class="flex-shrink-0 me-3">
                    <div class="bg-secondary text-white rounded-circle d-flex align-items-center justify-content-center" 
                         style="width: 32px; height: 32px; font-size: 0.8rem;">
                        <i class="fas fa-user"></i>
                    </div>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start mb-1">
                        <div>
                            <strong class="small">${this.sanitizeHtml(comment.username || 'Anonymous')}</strong>
                            <small class="text-muted ms-2">${this.formatDate(comment.createdAt)}</small>
                        </div>
                        ${comment.canDelete ? `
                            <button class="btn btn-sm btn-outline-danger delete-comment-inline-btn" 
                                    data-comment-id="${comment.id}" data-article-id="${articleId}"
                                    title="Delete comment">
                                <i class="fas fa-trash" style="font-size: 0.7rem;"></i>
                            </button>
                        ` : ''}
                    </div>
                    <p class="mb-0 small">${this.sanitizeHtml(comment.content)}</p>
                </div>
            </div>
        `).join('');

        // Build the complete comments section
        const commentsSection = `
            <div class="comments-section border-top pt-3 mt-3">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <h6 class="mb-0">
                        <i class="fas fa-comments me-2"></i>Comments (${comments.length})
                    </h6>
                    <button class="btn btn-sm btn-outline-secondary toggle-comments-btn">
                        <i class="fas fa-chevron-up"></i> Hide
                    </button>
                </div>
                
                <div class="comments-list" style="max-height: 400px; overflow-y: auto;">
                    ${commentsHtml || '<p class="text-muted text-center py-3">No comments yet. Be the first to comment!</p>'}
                </div>
                
                ${userId ? `
                    <div class="add-comment-form mt-3 pt-3 border-top">
                        <div class="d-flex gap-2">
                            <textarea class="form-control form-control-sm new-comment-text" rows="2" 
                                      placeholder="Write a comment..." data-article-id="${articleId}"></textarea>
                            <button class="btn btn-primary btn-sm submit-comment-inline-btn" 
                                    data-article-id="${articleId}">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                ` : '<div class="alert alert-info mt-3 mb-0 py-2 small">Please log in to comment.</div>'}
            </div>
        `;

        // Add to card and show with animation
        $card.find('.card-body').append(commentsSection);
        $card.find('.comments-section').hide().slideDown();
    },

    // NEW: Handle submit comment inline
    handleSubmitCommentInline: function(e) {
        const $btn = $(e.currentTarget);
        const articleId = $btn.data('article-id');
        const $textarea = $btn.siblings('.new-comment-text');
        const content = $textarea.val().trim();
        const userId = localStorage.getItem('userId');

        if (!content) {
            showAlert('warning', 'Please enter a comment');
            $textarea.focus();
            return;
        }

        const originalText = $btn.html();
        $btn.html('<i class="fas fa-spinner fa-spin"></i>').prop('disabled', true);
        $textarea.prop('disabled', true);

        ajaxCall(
            'POST',
            `${this.baseUrl}/shared/${articleId}/comments?userId=${userId}`,
            JSON.stringify({ content: content }),
            function(response) {
                if (response && response.success) {
                    // Track activity for commenting
                    const userId = localStorage.getItem('userId');
                    if (userId) {
                        ajaxCall(
                            'POST',
                            `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/activity/${userId}`,
                            null,
                            function() {
                                // Trigger avatar update after activity change
                                if (window.triggerAvatarUpdate) {
                                    window.triggerAvatarUpdate();
                                }
                            },
                            function(xhr, status, error) {
                                console.warn('Failed to track activity:', error);
                            }
                        );
                    }
                    
                    // Refresh the page to show the new comment
                    location.reload();
                } else {
                    showAlert('danger', response.message || 'Failed to add comment');
                    $btn.html(originalText).prop('disabled', false);
                    $textarea.prop('disabled', false);
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error adding comment:', error);
                showAlert('danger', 'Error adding comment');
                $btn.html(originalText).prop('disabled', false);
                $textarea.prop('disabled', false);
            }
        );
    },

    // NEW: Handle delete comment inline
    handleDeleteCommentInline: function(e) {
        const $btn = $(e.currentTarget);
        const commentId = $btn.data('comment-id');
        const articleId = $btn.data('article-id');
        const userId = localStorage.getItem('userId');

        if (!confirm('Are you sure you want to delete this comment?')) return;

        // Fire AJAX call in background
        ajaxCall(
            'DELETE',
            `${this.baseUrl}/shared/${articleId}/comments/${commentId}?userId=${userId}`,
            null
        );
        
        // Immediately refresh the page
        location.reload();
    },

    // Handle follow user
    handleFollowUser: function(e) {
        const $btn = $(e.currentTarget);
        const targetUserId = $btn.data('user-id');
        const username = $btn.data('username');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            showAlert('warning', 'Please log in to follow users');
            return;
        }

        // Fire AJAX call in background
        ajaxCall(
            'POST',
            `${this.baseUrl}/users/${targetUserId}/follow?userId=${userId}`,
            null
        );

        // Immediately refresh the page
        location.reload();
    },

    // Handle unfollow user
    handleUnfollowUser: function(e) {
        const $btn = $(e.currentTarget);
        const targetUserId = $btn.data('user-id');
        const username = $btn.data('username');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            showAlert('warning', 'Please log in to unfollow users');
            return;
        }

        if (!confirm(`Are you sure you want to unfollow ${username}?`)) return;

        // Fire AJAX call in background
        ajaxCall(
            'DELETE',
            `${this.baseUrl}/users/${targetUserId}/follow?userId=${userId}`,
            null
        );

        // Immediately refresh the page
        location.reload();
    },

    // Handle block user
    handleBlockUser: function(e) {
        const $btn = $(e.currentTarget);
        const targetUserId = $btn.data('user-id');
        const username = $btn.data('username');
        const userId = localStorage.getItem('userId');

        if (!userId) {
            showAlert('warning', 'Please log in to block users');
            return;
        }

        if (!confirm(`Are you sure you want to block ${username}? Their content will no longer be visible to you.`)) {
            return;
        }

        // Fire AJAX call in background
        ajaxCall(
            'POST',
            `${this.baseUrl}/users/${targetUserId}/block?userId=${userId}`,
            JSON.stringify({ reason: 'User blocked via shared articles page' }),
            null,
            function(xhr, status, error) {
                console.warn('Failed to block user:', error);
            }
        );

        // Immediately refresh the page
        location.reload();
    },

    // Handle report content
    handleReportContent: function(e) {
        const shareId = $(e.currentTarget).data('content-id');
        console.log('🔍 handleReportContent shareId:', shareId);
        
        const reasons = [
            'Offensive or inappropriate content',
            'False information or misinformation',
            'Spam or promotional content',
            'Copyright infringement',
            'Other'
        ];

        let reasonsHtml = reasons.map((reason, index) => 
            `<option value="${reason}">${reason}</option>`
        ).join('');

        const modalHtml = `
            <div class="modal fade" id="reportModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Report Content</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label for="reportReason" class="form-label">Reason for reporting *</label>
                                <select class="form-select" id="reportReason" required>
                                    <option value="">Select a reason...</option>
                                    ${reasonsHtml}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label for="reportDescription" class="form-label">Additional details (optional)</label>
                                <textarea class="form-control" id="reportDescription" rows="3" 
                                          placeholder="Please provide any additional details..."></textarea>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-danger" id="submitReport" data-share-id="${shareId}">
                                <i class="fas fa-flag me-1"></i>Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        $('#reportModal').remove();
        
        // Add new modal
        $('body').append(modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('reportModal'));
        modal.show();

        // Handle submit report
        $('#submitReport').on('click', function() {
            const reason = $('#reportReason').val();
            const description = $('#reportDescription').val().trim();
            
            if (!reason) {
                showAlert('warning', 'Please select a reason for reporting');
                return;
            }

            // Get shareId from the button's data attribute
            const buttonShareId = $(this).data('share-id');
            const fullReason = description ? `${reason}: ${description}` : reason;
            
            console.log('🔍 Report button shareId:', buttonShareId);
            ShareManager.submitReport('shared_article', buttonShareId, fullReason);
            modal.hide();
        });
        
        // Remove modal when hidden
        $('#reportModal').on('hidden.bs.modal', function() {
            $(this).remove();
        });
    },

    // Submit report
    submitReport: function(contentType, contentId, reason) {
        const userId = localStorage.getItem('userId');
        
        // Validate inputs before sending
        console.log('📤 Raw inputs:', { contentType, contentId, reason, userId });
        
        // Check each field individually
        if (!contentType) {
            console.error('❌ Missing contentType');
            showAlert('danger', 'Content type is required');
            return;
        }
        
        if (!contentId) {
            console.error('❌ Missing contentId');
            showAlert('danger', 'Content ID is required');
            return;
        }
        
        if (!reason || reason.trim() === '') {
            console.error('❌ Missing or empty reason');
            showAlert('danger', 'Please select a reason for reporting');
            return;
        }
        
        if (!userId) {
            console.error('❌ Missing userId');
            showAlert('danger', 'User authentication required');
            return;
        }
        
        const parsedContentId = parseInt(contentId);
        if (isNaN(parsedContentId) || parsedContentId <= 0) {
            console.error('❌ Invalid ContentId:', contentId, 'parsed as:', parsedContentId);
            showAlert('danger', 'Invalid content ID for report');
            return;
        }
        
        const requestData = {
            ContentType: contentType,
            ContentId: parsedContentId,
            Reason: reason.trim()
        };
        
        console.log('📤 Final request data:', requestData);
        console.log('📤 Request JSON:', JSON.stringify(requestData));
        console.log('📤 URL:', `${this.baseUrl}/reports?userId=${userId}`);

        ajaxCall(
            'POST',
            `${this.baseUrl}/reports?userId=${userId}`,
            JSON.stringify(requestData),
            function(response) {
                if (response && response.success) {
                    showAlert('success', 'Report submitted successfully. Thank you for helping keep our community safe.');
                } else {
                    showAlert('danger', response.message || 'Failed to submit report');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error submitting report:', error);
                console.error('❌ Response status:', xhr.status);
                console.error('❌ Response text:', xhr.responseText);
                
                // Try to parse and show specific error message
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    showAlert('danger', xhr.responseJSON.message);
                } else if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        showAlert('danger', errorResponse.message || 'Error submitting report');
                    } catch (parseError) {
                        showAlert('danger', 'Error submitting report - invalid server response');
                    }
                } else {
                    showAlert('danger', 'Error submitting report');
                }
            }
        );
    },

    // Handle delete shared article
    handleDeleteShared: function(e) {
        const shareId = $(e.currentTarget).data('share-id');
        const userId = localStorage.getItem('userId');

        if (!confirm('Are you sure you want to delete this shared article?')) return;

        // Fire AJAX call in background
        ajaxCall(
            'DELETE',
            `${this.baseUrl}/shared/${shareId}?userId=${userId}`,
            null
        );
        
        // Immediately refresh the page
        location.reload();
    },

    // Handle save article
    handleSaveArticle: function(e) {
        const articleData = JSON.parse($(e.currentTarget).attr('data-article').replace(/&apos;/g, "'"));
        const userId = localStorage.getItem('userId');

        ajaxCall(
            'POST',
            `${this.baseUrl}/news/save?userId=${userId}`,
            JSON.stringify({
                title: articleData.articleTitle || 'Shared Article',
                content: articleData.articleDescription || articleData.comment,
                url: articleData.url,
                urlToImage: articleData.articleImageUrl,
                publishedAt: new Date().toISOString(),
                source: articleData.articleSource || 'Shared Content',
                category: 'general'
            }),
            function(response) {
                if (response && response.newsId) {
                    showAlert('success', 'Article saved successfully!');
                } else {
                    showAlert('warning', 'Article may already be saved');
                }
            },
            function(xhr, status, error) {
                console.error('❌ Error saving article:', error);
                showAlert('danger', 'Failed to save article');
            }
        );
    },

    // Apply filters to shared content
    applyFilters: function() {
        let filtered = this.sharedContent.slice();
        
        // Filter by user
        const userFilter = $('#userFilter').val().trim().toLowerCase();
        if (userFilter) {
            filtered = filtered.filter(item => 
                item.username && item.username.toLowerCase().includes(userFilter)
            );
        }
        
        // Filter by following only
        const followingOnly = $('#followingOnlyFilter').is(':checked');
        if (followingOnly && this.followingUsers.length > 0) {
            const followingIds = this.followingUsers.map(f => f.followedUserId);
            filtered = filtered.filter(item => followingIds.includes(item.userId));
        }
        
        // Filter out blocked users
        const blockedUserIds = this.blockedUsers.map(u => u.blockedUserId);
        filtered = filtered.filter(item => !blockedUserIds.includes(item.userId));
        
        // Sort
        const sortBy = $('#sortShared').val() || 'newest';
        switch (sortBy) {
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'most_comments':
                filtered.sort((a, b) => (b.commentsCount || 0) - (a.commentsCount || 0));
                break;
            case 'most_liked':
                filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
                break;
            default: // newest
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        this.filteredContent = filtered;
        this.currentPage = 1;
        this.displaySharedContent();
        this.updateFilterIndicators();
    },

    // Clear all filters
    clearAllFilters: function() {
        $('#userFilter').val('');
        $('#sortShared').val('newest');
        $('#followingOnlyFilter').prop('checked', false);
        
        this.applyFilters();
        showAlert('info', 'All filters cleared');
    },

    // Display shared content
    displaySharedContent: function() {
        const $container = $('#sharedContent');
        const userId = localStorage.getItem('userId');
        const currentUser = window.Auth ? window.Auth.getCurrentUser() : {};
        const isAdmin = currentUser.isAdmin === true;
        
        if (!this.filteredContent || this.filteredContent.length === 0) {
            $container.html(`
                <div class="text-center py-5">
                    <i class="fas fa-share-alt fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No shared articles found</h5>
                    <p class="text-muted">Try adjusting your filters or be the first to share an article!</p>
                </div>
            `);
            return;
        }

        // Get current page items
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageItems = this.filteredContent.slice(startIndex, endIndex);
        
        const html = pageItems.map(item => {
            const imageUrl = item.articleImageUrl || '/assets/default-news.jpg';
            const isCurrentUser = userId && parseInt(userId) === item.userId;
            const isFollowing = this.followingUsers.some(f => f.followedUserId === item.userId);
            
            // Get user avatar based on activity level - use the article owner's activity level
            let avatarSrc = '../assets/default-avatar.png';
            if (item.activityLevel !== undefined) {
                if (item.activityLevel >= 50) {
                    avatarSrc = '../assets/avatar-legend.png';
                } else if (item.activityLevel >= 30) {
                    avatarSrc = '../assets/avatar-master.png';
                } else if (item.activityLevel >= 20) {
                    avatarSrc = '../assets/avatar-expert.png';
                } else if (item.activityLevel >= 10) {
                    avatarSrc = '../assets/avatar-active.png';
                } else {
                    avatarSrc = '../assets/avatar-reader.png';
                }
            }
            
            return `
                <div class="card mb-4" data-share-id="${item.id}" data-user-id="${item.userId}">
                    <div class="card-body">
                        <div class="d-flex align-items-start mb-3">
                            <div class="flex-shrink-0">
                                <img src="${avatarSrc}" alt="User Avatar" class="rounded-circle" 
                                     style="width: 40px; height: 40px; object-fit: cover;">
                            </div>
                            <div class="flex-grow-1 ms-3">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 class="mb-1">
                                            ${this.sanitizeHtml(item.username || 'Anonymous')}
                                            ${item.tags ? item.tags.split(',').map(tag => 
                                                `<span class="badge bg-secondary ms-1">${this.sanitizeHtml(tag.trim())}</span>`
                                            ).join('') : ''}
                                        </h6>
                                        <small class="text-muted">${this.formatDate(item.createdAt)}
                                            ${isFollowing ? '<span class="badge bg-info ms-1">Following</span>' : ''}
                                        </small>
                                    </div>
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li>
                                                <button class="dropdown-item save-article-btn" 
                                                        data-article='${JSON.stringify({
                                                    url: item.url,
                                                    articleTitle: item.articleTitle,
                                                    articleDescription: item.articleDescription,
                                                    articleImageUrl: item.articleImageUrl,
                                                    articleSource: item.articleSource,
                                                    comment: item.comment
                                                }).replace(/'/g, "&apos;")}'>
                                                    <i class="fas fa-bookmark me-2"></i>Save Article
                                                </button>
                                            </li>
                                            <li>
                                                <button class="dropdown-item report-content-btn" 
                                                        data-content-type="shared_article" data-content-id="${item.id}">
                                                    <i class="fas fa-flag me-2"></i>Report Content
                                                </button>
                                            </li>
                                            ${!isCurrentUser ? `
                                                <li>
                                                    <button class="dropdown-item ${isFollowing ? 'text-warning' : 'text-primary'} ${isFollowing ? 'unfollow-user-btn' : 'follow-user-btn'}" 
                                                            data-user-id="${item.userId}" data-username="${item.username}">
                                                        <i class="fas ${isFollowing ? 'fa-user-minus' : 'fa-user-plus'} me-2"></i>${isFollowing ? 'Unfollow' : 'Follow'} ${item.username}
                                                    </button>
                                                </li>
                                                <li>
                                                    <button class="dropdown-item text-danger block-user-btn" 
                                                            data-user-id="${item.userId}" data-username="${item.username}">
                                                        <i class="fas fa-ban me-2"></i>Block User
                                                    </button>
                                                </li>
                                            ` : ''}
                                            ${(isCurrentUser || isAdmin) ? `
                                                <li><hr class="dropdown-divider"></li>
                                                <li>
                                                    <button class="dropdown-item text-danger delete-shared-btn" 
                                                            data-share-id="${item.id}">
                                                        <i class="fas fa-trash me-2"></i>Delete
                                                    </button>
                                                </li>
                                            ` : ''}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        ${item.comment ? `
                            <p class="mb-3">${this.sanitizeHtml(item.comment)}</p>
                        ` : ''}
                        
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${imageUrl}" class="img-fluid rounded" 
                                     style="width: 100%; height: 200px; object-fit: cover;" alt="Article Image"
                                     onerror="this.src='/assets/default-news.jpg'">
                            </div>
                            <div class="col-md-8">
                                <h6 class="card-title">
                                    <a href="${item.url}" target="_blank" class="text-decoration-none">
                                        ${this.sanitizeHtml(item.articleTitle || 'Article')}
                                        <i class="fas fa-external-link-alt ms-1 small"></i>
                                    </a>
                                </h6>
                                <p class="card-text text-muted small">
                                    ${this.truncateText(item.articleDescription || 'No description available', 150)}
                                </p>
                                <small class="text-muted">
                                    <i class="fas fa-globe me-1"></i>
                                    ${this.sanitizeHtml(item.articleSource || 'Unknown Source')}
                                </small>
                            </div>
                        </div>
                        
                        <hr>
                        
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex gap-2">
                                <button class="btn btn-sm ${item.isLikedByCurrentUser ? 'btn-danger liked' : 'btn-outline-danger'} like-btn" 
                                        data-article-id="${item.id}">
                                    <i class="${item.isLikedByCurrentUser ? 'fas' : 'far'} fa-heart me-1"></i>
                                    <span class="like-count">${item.likes || 0}</span>
                                </button>
                                <button class="btn btn-sm btn-outline-primary comment-btn" 
                                        data-article-id="${item.id}">
                                    <i class="far fa-comment me-1"></i>${item.commentsCount || 0}
                                </button>
                            </div>
                            <small class="text-muted">
                                <i class="fas fa-clock me-1"></i>${this.formatDate(item.createdAt)}
                            </small>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        $container.html(html);
        this.updatePagination();
    },

    // Display blocked users
    displayBlockedUsers: function() {
        const $container = $('#blockedUsers');
        
        if (!this.blockedUsers || this.blockedUsers.length === 0) {
            $container.html('<p class="text-muted small">No blocked users</p>');
            return;
        }
        
        const html = this.blockedUsers.map(user => `
            <div class="d-flex justify-content-between align-items-center py-2 border-bottom">
                <div>
                    <strong>${this.sanitizeHtml(user.blockedUsername || 'Unknown')}</strong>
                    <br>
                    <small class="text-muted">Blocked ${this.formatDate(user.blockedAt)}</small>
                </div>
                <button class="btn btn-outline-success btn-sm" 
                        onclick="ShareManager.unblockUser(${user.blockedUserId}, '${user.blockedUsername}')">
                    <i class="fas fa-unlock me-1"></i>Unblock
                </button>
            </div>
        `).join('');
        
        $container.html(html);
    },

    // Display following stats
    displayFollowingStats: function(stats) {
        const $container = $('#followingStats');
        
        if (stats) {
            $container.html(`
                <div class="row text-center">
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">${stats.following || 0}</h6>
                            <small class="text-muted">Following</small>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="border rounded p-2">
                            <h6 class="mb-1">${stats.followers || 0}</h6>
                            <small class="text-muted">Followers</small>
                        </div>
                    </div>
                </div>
            `);
            
            // Enable following filter if user is following someone
            if (stats.following > 0) {
                $('#followingOnlyFilter').prop('disabled', false);
                $('.badge.bg-warning').text('Active');
            }
        }
    },

    // Unblock user
    unblockUser: function(targetUserId, username) {
        const userId = localStorage.getItem('userId');

        if (!confirm(`Are you sure you want to unblock ${username}?`)) return;

        // Fire AJAX call in background
        ajaxCall(
            'DELETE',
            `${this.baseUrl}/users/${targetUserId}/block?userId=${userId}`,
            null
        );

        // Immediately refresh the page
        location.reload();
    },

    // Update filter indicators
    updateFilterIndicators: function() {
        // This can be enhanced to show active filters
        const totalCount = this.sharedContent.length;
        const filteredCount = this.filteredContent.length;
        
        if (filteredCount < totalCount) {
            $('#sharedContent').prepend(`
                <div class="alert alert-info alert-dismissible">
                    <i class="fas fa-filter me-2"></i>
                    Showing ${filteredCount} of ${totalCount} articles (filtered)
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                </div>
            `);
        }
    },

    // Update pagination
    updatePagination: function() {
        const totalPages = Math.ceil(this.filteredContent.length / this.itemsPerPage);
        const $pagination = $('#sharedPagination');
        
        if (totalPages <= 1) {
            $pagination.empty();
            return;
        }
        
        let paginationHtml = `
            <nav aria-label="Shared articles pagination">
                <ul class="pagination justify-content-center">
                    <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                        <button class="page-link pagination-btn" data-page="${this.currentPage - 1}">
                            <i class="fas fa-chevron-left"></i> Previous
                        </button>
                    </li>
        `;
        
        // Show page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHtml += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
            } else {
                paginationHtml += `<li class="page-item"><button class="page-link pagination-btn" data-page="${i}">${i}</button></li>`;
            }
        }
        
        paginationHtml += `
                    <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                        <button class="page-link pagination-btn" data-page="${this.currentPage + 1}">
                            Next <i class="fas fa-chevron-right"></i>
                        </button>
                    </li>
                </ul>
            </nav>
        `;
        
        $pagination.html(paginationHtml);
    },

    // Handle pagination
    handlePagination: function(e) {
        const page = parseInt($(e.target).data('page'));
        if (page && page !== this.currentPage) {
            this.currentPage = page;
            this.displaySharedContent();
            
            // Scroll to top of content
            document.getElementById('sharedContent').scrollIntoView({ behavior: 'smooth' });
        }
    },

    // Show error message
    showErrorMessage: function(message) {
        $('#sharedContent').html(`
            <div class="alert alert-danger text-center">
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Error</h6>
                <p>${message}</p>
                <button class="btn btn-outline-danger btn-sm" onclick="ShareManager.loadSharedContent()">
                    <i class="fas fa-refresh me-1"></i>Try Again
                </button>
            </div>
        `);
    },

    // Utility functions
    isValidUrl: function(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    sanitizeHtml: function(text) {
        if (!text) return '';
        return $('<div>').text(text).html();
    },

    truncateText: function(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    formatDate: function(dateString) {
        if (!dateString) return 'Unknown';
        
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffMs = now - date;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMs / 3600000);
            const diffDays = Math.floor(diffMs / 86400000);

            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            if (diffHours < 24) return `${diffHours}h ago`;
            if (diffDays < 7) return `${diffDays}d ago`;
            return date.toLocaleDateString();
        } catch (error) {
            return 'Invalid date';
        }
    },

    // Update navbar avatar after activity changes
    updateNavbarAfterActivity: function() {
        const userId = localStorage.getItem('userId');
        if (!userId) return;

        // Fetch updated user data to get new activity level
        ajaxCall(
            'GET',
            `https://proj.ruppin.ac.il/cgroup17/test2/tar1/api/users/GetById/${userId}`,
            null,
            function(userData) {
                // Update localStorage with new activity level
                const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
                currentUser.activityLevel = userData.activityLevel || 0;
                localStorage.setItem('userInfo', JSON.stringify(currentUser));
                
                // Update all avatars using centralized system
                if (window.updateAllAvatars) {
                    window.updateAllAvatars(userData.activityLevel || 0);
                }
            },
            function(xhr, status, error) {
                console.warn('Failed to update navbar after activity change:', error);
            }
        );
    }
};

// Initialize when page loads
$(document).ready(function() {
    if (window.location.pathname.indexOf('shared.html') !== -1 || 
        window.location.href.indexOf('shared.html') !== -1) {
        ShareManager.init();
    }
});