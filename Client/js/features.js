// features.js - Features Demo Page JavaScript
var FeaturesDemo = {
    // Initialize the page
    init: function () {
        this.checkSystemStatus();

    },

    // SYSTEM STATUS METHODS
    // ---------------------
    checkSystemStatus: function () {
        // Use the new public stats endpoint
        $.ajax({
            type: 'GET',
            url: 'http://localhost:5121/api/Users/stats',
            cache: false,
            dataType: "json",
            success: function (response) {
                // Update Server Status
                var serverStatus = document.getElementById('serverStatus');
                if (serverStatus) {
                    serverStatus.innerHTML = '<i class="fas fa-check-circle text-success"></i>';
                }

                // Update Total Users
                const totalUsers = response.totalUsers !== undefined ? response.totalUsers : '--';
                var totalUsersEl = document.getElementById('totalUsers');
                if (totalUsersEl) {
                    totalUsersEl.textContent = totalUsers;
                }

                // Update News/Saved Articles
                const totalNews = response.totalSavedArticles !== undefined ? response.totalSavedArticles : '--';
                var totalNewsEl = document.getElementById('totalNews');
                if (totalNewsEl) {
                    totalNewsEl.textContent = totalNews;
                }

                // Update User Status
                FeaturesDemo.updateUserStatusIndicator();
            },
            error: function (xhr, status, error) {
                console.error('System stats check failed:', error);
                var serverStatus = document.getElementById('serverStatus');
                if (serverStatus) {
                    serverStatus.innerHTML = '<i class="fas fa-exclamation-triangle text-danger"></i>';
                }

                var totalUsersEl = document.getElementById('totalUsers');
                if (totalUsersEl) {
                    totalUsersEl.textContent = '--';
                }

                var totalNewsEl = document.getElementById('totalNews');
                if (totalNewsEl) {
                    totalNewsEl.textContent = '--';
                }

                FeaturesDemo.updateUserStatusIndicator();
            }
        });
    },

    updateUserStatusIndicator: function () {
        var userStatusEl = document.getElementById('userStatus');
        if (!userStatusEl) return;

        if (Auth.isLoggedIn()) {
            userStatusEl.innerHTML = '<i class="fas fa-user-check text-success"></i>';
        } else {
            userStatusEl.innerHTML = '<i class="fas fa-user-times text-warning"></i>';
        }
    }
};

// Initialize when page loads
$(document).ready(function () {
    FeaturesDemo.init();
});