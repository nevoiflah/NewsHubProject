const SimpleNotification = {
    success: function (message) {
        this.show(message, 'success');
    },
    error: function (message) {
        this.show(message, 'danger');
    },
    warning: function (message) {
        this.show(message, 'warning');
    },
    info: function (message) {
        this.show(message, 'info');
    },
    show: function (message, type = 'info') {
        const toastId = 'toast-' + Date.now();
        const icon = type === 'success' ? 'fa-check-circle' :
            type === 'danger' ? 'fa-exclamation-circle' :
                type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle';

        const html = `
            <div id="${toastId}" class="toast align-items-center text-white bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true" style="position: fixed; top: 20px; right: 20px; z-index: 9999;">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="fas ${icon} me-2"></i> ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;

        $('body').append(html);
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
        toast.show();

        toastElement.addEventListener('hidden.bs.toast', function () {
            $(this).remove();
        });
    }
};

// Expose globally
window.SimpleNotification = SimpleNotification;
