    // admin.js 
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
            $('[data-section]').on('click', function(e) {
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

        // Load dashboard data 
        loadDashboardData: async () => {
        
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/stats',
                cache: false,
                dataType: "json",
                success: function(stats) {
                    $('#totalUsers').text(stats.totalUsers || 0);
                    $('#dailyLogins').text(stats.totalUsers || 0); // Backend doesn't have daily logins yet
                    $('#newsFetched').text(stats.totalNewsPulled || 0);
                    $('#articlesSaved').text(stats.totalSavedNews || 0);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading dashboard data:', error);
                    // Set default values on error
                    $('#totalUsers').text('0');
                    $('#dailyLogins').text('0');
                    $('#newsFetched').text('0');
                    $('#articlesSaved').text('0');
                }
            });
        },

        // Load users data 
        loadUsersData: async () => {
        
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/users',
                cache: false,
                dataType: "json",
                success: function(users) {
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
                                <td>${Utils.formatDate(user.createdAt)}</td>
                                <td>${statusBadge}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-primary" onclick="AdminManager.editUser(${user.id})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-outline-${user.isLocked ? 'success' : 'warning'}" 
                                                onclick="AdminManager.toggleUserLock(${user.id}, ${user.isLocked})">
                                            <i class="fas fa-${user.isLocked ? 'unlock' : 'lock'}"></i>
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="AdminManager.deleteUser(${user.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                
                    $tbody.html(rows);
                    AdminManager.updateBulkOperationsUI();
                },
                error: function(xhr, status, error) {
                    console.error('Error loading users:', error);
                    const $tbody = $('#usersTable');
                    $tbody.html('<tr><td colspan="6" class="text-center text-danger">Failed to load users</td></tr>');
                }
            });
        },

        // Load reports data 
        loadReportsData: async () => {
        
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Reports',
                cache: false,
                dataType: "json",
                success: function(reports) {
                    const $tbody = $('#reportsTable');
                
                    if (!reports || reports.length === 0) {
                        $tbody.html('<tr><td colspan="6" class="text-center text-muted">No reports found</td></tr>');
                        return;
                    }

                    const rows = reports.map(report => {
                        const statusBadge = report.isResolved ? 
                            '<span class="badge bg-success">Resolved</span>' : 
                            '<span class="badge bg-warning">Pending</span>';
                    
                        return `
                            <tr data-report-id="${report.id}">
                                <td>${report.id}</td>
                                <td>${Utils.sanitizeHtml(report.reporterUsername || 'Unknown')}</td>
                                <td>${Utils.sanitizeHtml(report.contentType)}</td>
                                <td>${Utils.sanitizeHtml(report.reason)}</td>
                                <td>${Utils.formatDate(report.createdAt)}</td>
                                <td>${statusBadge}</td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <button class="btn btn-outline-info" onclick="AdminManager.viewReport(${report.id})">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${!report.isResolved ? `
                                            <button class="btn btn-outline-success" onclick="AdminManager.resolveReport(${report.id})">
                                                <i class="fas fa-check"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn btn-outline-danger" onclick="AdminManager.deleteReport(${report.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                
                    $tbody.html(rows);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading reports:', error);
                    const $tbody = $('#reportsTable');
                    $tbody.html('<tr><td colspan="7" class="text-center text-danger">Failed to load reports</td></tr>');
                }
            });
        },

        // Load analytics data 
        loadAnalyticsData: async () => {
        
            // Load login trends
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/analytics/logins',
                cache: false,
                dataType: "json",
                success: function(data) {
                    AdminManager.renderLoginChart(data);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading login analytics:', error);
                }
            });

            // Load user activity
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/analytics/activity',
                cache: false,
                dataType: "json",
                success: function(data) {
                    AdminManager.renderActivityChart(data);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading activity analytics:', error);
                }
            });

            // Load content stats
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/analytics/content',
                cache: false,
                dataType: "json",
                success: function(data) {
                    AdminManager.renderContentChart(data);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading content analytics:', error);
                }
            });

            // Load performance metrics
            $.ajax({
                type: 'GET',
                url: 'http://localhost:5121/api/Admin/analytics/performance',
                cache: false,
                dataType: "json",
                success: function(data) {
                    AdminManager.renderPerformanceChart(data);
                },
                error: function(xhr, status, error) {
                    console.error('Error loading performance analytics:', error);
                }
            });
        },

        // Toggle user lock status 
        toggleUserLock: async (userId, isCurrentlyLocked) => {
            const action = isCurrentlyLocked ? 'unlock' : 'lock';
            const confirmMessage = `Are you sure you want to ${action} this user?`;
        
            if (!confirm(confirmMessage)) return;
        
        
            $.ajax({
                type: 'PUT',
                url: `http://localhost:5121/api/Admin/users/${userId}/${action}`,
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function(response) {
                    if (response && response.success) {
                        showAlert('success', `User ${action}ed successfully`);
                        AdminManager.loadUsersData(); // Reload the users table
                    } else {
                        showAlert('danger', `Failed to ${action} user`);
                    }
                },
                error: function(xhr, status, error) {
                    console.error(`Error ${action}ing user:`, error);
                    showAlert('danger', `Error ${action}ing user`);
                }
            });
        },

        // Delete user 
        deleteUser: async (userId) => {
            if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        
        
            $.ajax({
                type: 'DELETE',
                url: `http://localhost:5121/api/Admin/users/${userId}`,
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function(response) {
                    if (response && response.success) {
                        showAlert('success', 'User deleted successfully');
                        AdminManager.loadUsersData(); // Reload the users table
                    } else {
                        showAlert('danger', 'Failed to delete user');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error deleting user:', error);
                    showAlert('danger', 'Error deleting user');
                }
            });
        },

        // Resolve report 
        resolveReport: async (reportId) => {
            if (!confirm('Mark this report as resolved?')) return;
        
        
            $.ajax({
                type: 'PUT',
                url: `http://localhost:5121/api/Reports/${reportId}/resolve`,
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function(response) {
                    if (response && response.success) {
                        showAlert('success', 'Report resolved successfully');
                        AdminManager.loadReportsData(); // Reload the reports table
                    } else {
                        showAlert('danger', 'Failed to resolve report');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error resolving report:', error);
                    showAlert('danger', 'Error resolving report');
                }
            });
        },

        // Delete report - Using direct $.ajax
        deleteReport: async (reportId) => {
            if (!confirm('Are you sure you want to delete this report?')) return;
        
        
            $.ajax({
                type: 'DELETE',
                url: `http://localhost:5121/api/Reports/${reportId}`,
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function(response) {
                    if (response && response.success) {
                        showAlert('success', 'Report deleted successfully');
                        AdminManager.loadReportsData(); // Reload the reports table
                    } else {
                        showAlert('danger', 'Failed to delete report');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error deleting report:', error);
                    showAlert('danger', 'Error deleting report');
                }
            });
        },

        // Render charts using Chart.js
        renderLoginChart: (data) => {
            const ctx = document.getElementById('loginChart');
            if (!ctx || !data) return;

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'Daily Logins',
                        data: data.values || [],
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        },

        renderActivityChart: (data) => {
            const ctx = document.getElementById('activityChart');
            if (!ctx || !data) return;

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'User Activity',
                        data: data.values || [],
                        backgroundColor: 'rgba(54, 162, 235, 0.8)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        },

        renderContentChart: (data) => {
            const ctx = document.getElementById('contentChart');
            if (!ctx || !data) return;

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        data: data.values || [],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.8)',
                            'rgba(54, 162, 235, 0.8)',
                            'rgba(255, 205, 86, 0.8)',
                            'rgba(75, 192, 192, 0.8)',
                            'rgba(153, 102, 255, 0.8)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            display: true,
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        },

        renderPerformanceChart: (data) => {
            const ctx = document.getElementById('performanceChart');
            if (!ctx || !data) return;

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels || [],
                    datasets: [{
                        label: 'Response Time (ms)',
                        data: data.values || [],
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle'
                            }
                        }
                    }
                }
            });
        },

        // Generate and download admin report 
        generateReport: async () => {
            try {
                showAlert('info', 'Generating admin report...');
            
                const promises = [];
            
                // Create promises for each API call
                promises.push(new Promise((resolve) => {
                    $.ajax({
                        type: 'GET',
                        url: 'http://localhost:5121/api/Admin/stats',
                        cache: false,
                        dataType: "json",
                        success: resolve,
                        error: () => resolve({})
                    });
                }));
            
                promises.push(new Promise((resolve) => {
                    $.ajax({
                        type: 'GET',
                        url: 'http://localhost:5121/api/Admin/users',
                        cache: false,
                        dataType: "json",
                        success: resolve,
                        error: () => resolve([])
                    });
                }));
            
                promises.push(new Promise((resolve) => {
                    $.ajax({
                        type: 'GET',
                        url: 'http://localhost:5121/api/Reports',
                        cache: false,
                        dataType: "json",
                        success: resolve,
                        error: () => resolve([])
                    });
                }));

                const [stats, users, reports] = await Promise.all(promises);

                const reportData = {
                    generatedAt: new Date().toISOString(),
                    summary: stats,
                    userCount: users.length,
                    activeUsers: users.filter(u => !u.isLocked).length,
                    lockedUsers: users.filter(u => u.isLocked).length,
                    pendingReports: reports.filter(r => !r.isResolved).length,
                    totalReports: reports.length
                };

                const dataStr = JSON.stringify(reportData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
                const exportFileDefaultName = `admin-report-${new Date().toISOString().split('T')[0]}.json`;
            
                // Create download link using jQuery
                const $linkElement = $('<a>').attr({
                    href: dataUri,
                    download: exportFileDefaultName
                });
            
                $linkElement[0].click();
            
                showAlert('success', 'Admin report downloaded successfully');
            } catch (error) {
                console.error('Error generating report:', error);
                showAlert('danger', 'Failed to generate admin report');
            }
        },

        // Bulk user operations
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

        // Bulk operations
        performBulkOperation: async (operation) => {
            const $selectedCheckboxes = $('.user-checkbox:checked');
            const selectedUserIds = $selectedCheckboxes.map(function() {
                return $(this).val();
            }).get();

            if (selectedUserIds.length === 0) {
                showAlert('warning', 'Please select users first');
                return;
            }

            const confirmMessage = `Are you sure you want to ${operation} ${selectedUserIds.length} user(s)?`;
            if (!confirm(confirmMessage)) return;

            let endpoint = '';
            let method = 'PUT';

            switch (operation) {
                case 'lock':
                    endpoint = 'http://localhost:5121/api/Admin/users/bulk/lock';
                    break;
                case 'unlock':
                    endpoint = 'http://localhost:5121/api/Admin/users/bulk/unlock';
                    break;
                case 'delete':
                    endpoint = 'http://localhost:5121/api/Admin/users/bulk/delete';
                    method = 'DELETE';
                    break;
                default:
                    showAlert('danger', 'Invalid operation');
                    return;
            }

            $.ajax({
                type: method,
                url: endpoint,
                data: JSON.stringify({ userIds: selectedUserIds }),
                cache: false,
                contentType: "application/json",
                dataType: "json",
                success: function(response) {
                    if (response && response.success) {
                        showAlert('success', `Bulk ${operation} completed successfully`);
                        AdminManager.loadUsersData(); // Reload the users table
                    } else {
                        showAlert('danger', `Bulk ${operation} failed`);
                    }
                },
                error: function(xhr, status, error) {
                    console.error(`Error performing bulk ${operation}:`, error);
                    showAlert('danger', `Error performing bulk ${operation}`);
                }
            });
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
        }
    };

    // Initialize when page loads
    $(document).ready(function() {
        AdminManager.init();
    });