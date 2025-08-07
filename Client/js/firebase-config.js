const firebaseConfig = {
  apiKey: "AIzaSyBaQvw0SPblRIdc_PZN8L2uxQSJI7jGbHQ",
  authDomain: "newshub-aaa5c.firebaseapp.com",
  projectId: "newshub-aaa5c",
  storageBucket: "newshub-aaa5c.firebasestorage.app",
  messagingSenderId: "610570159104",
  appId: "1:610570159104:web:4114a16df0ed20fc9184e5",
  measurementId: "G-RC6XYMVT61"
};

class NotificationService {
    constructor() {
        this.currentUser = null;
        this.unsubscribers = [];
        this.app = null;
        this.messaging = null;
        this.db = null;
        this.isInitialized = false;
        this.firebaseModules = null;
    }

    async initializeFirebase() {
        try {
            // Import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');

            this.app = initializeApp(firebaseConfig);
            this.messaging = getMessaging(this.app);
            
            // Store modules for later use
            this.firebaseModules = {
                getToken,
                onMessage
            };
            
            this.isInitialized = true;
            console.log('✅ Firebase initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            return false;
        }
    }

    async initializeForUser(userId, userInterests = []) {
        if (!this.isInitialized) {
            const firebaseReady = await this.initializeFirebase();
            if (!firebaseReady) {
                return false;
            }
        }
    
        this.currentUser = userId;
    
        try {
            if (!('Notification' in window)) {
                console.warn('❌ Notifications not supported in this browser');
                return false;
            }
        
            let permission = Notification.permission;
        
            if (permission === 'default') {
                this.showNotificationPrompt(userId, userInterests);
                return false;
            }
        
            if (permission === 'granted') {
                return await this.setupNotifications(userId, userInterests);
            } else {
                console.warn('❌ Notification permission denied');
                return false;
            }
        
        } catch (error) {
            console.error('❌ Error initializing notifications:', error);
            return false;
        }
    }

    showNotificationPrompt(userId, userInterests) {
        const promptHtml = `
            <div class="notification-prompt" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                text-align: center;
            ">
                <h4 style="margin-bottom: 15px; color: #333;">
                    <i class="fas fa-bell" style="color: #007bff; margin-right: 10px;"></i>
                    Enable Notifications
                </h4>
                <p style="margin-bottom: 20px; color: #666; line-height: 1.5;">
                    Stay updated with breaking news, user interactions, and community updates. 
                    We'll only send you notifications for things you care about.
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="NotificationService.enableNotifications(${userId})" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 500;
                    ">Enable Notifications</button>
                    <button onclick="NotificationService.dismissPrompt()" style="
                        background: #6c757d;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 5px;
                        cursor: pointer;
                    ">Not Now</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', promptHtml);
    }

    static async enableNotifications(userId) {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                // Remove prompt
                const prompt = document.querySelector('.notification-prompt');
                if (prompt) prompt.remove();
                
                // Initialize notifications
                if (window.notificationService) {
                    await window.notificationService.setupNotifications(userId);
                }
            }
        } catch (error) {
            console.error('Error enabling notifications:', error);
        }
    }

    static dismissPrompt() {
        const prompt = document.querySelector('.notification-prompt');
        if (prompt) prompt.remove();
    }

    async setupNotifications(userId, userInterests = []) {
        try {
            await this.registerServiceWorker();
        
            const token = await this.firebaseModules.getToken(this.messaging, {
                vapidKey: 'BBzIJz2Hrx6LDER7EApmNDqy2gHhKuV3R8oUG3nX7sCAR-VckGJ_rgydYldzXntwwL0NxaTqFKU-HYoomm2_YDI'
            });
        
            if (token) {
                console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
                localStorage.setItem('fcmToken', token);
            
                const registered = await this.registerTokenWithBackend(token, userId);
            
                if (registered) {
                    this.firebaseModules.onMessage(this.messaging, (payload) => {
                        this.handleForegroundMessage(payload);
                    });
                
                    console.log('✅ Notifications setup complete');
                    return true;
                }
            }
        
            return false;
        } catch (error) {
            console.error('❌ Error setting up notifications:', error);
            return false;
        }
    }

    async registerServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('✅ Service Worker registered:', registration);
                return registration;
            } else {
                throw new Error('Service Worker not supported');
            }
        } catch (error) {
            console.error('❌ Service Worker registration failed:', error);
            throw error;
        }
    }

    async registerTokenWithBackend(token, userId) {
        try {
            const response = await $.ajax({
                type: 'POST',
                url: 'http://localhost:5121/api/notification/register-token',
                data: JSON.stringify({
                    token,
                    userId,
                    deviceType: 'web',
                    userAgent: navigator.userAgent
                }),
                cache: false,
                contentType: "application/json",
                dataType: "json",
                timeout: 30000
            });

            if (response && response.success) {
                console.log('✅ Token registered with backend');
                return true;
            } else {
                console.error('❌ Failed to register token with backend');
                return false;
            }
        } catch (error) {
            console.error('❌ Error registering token with backend:', error);
            return false;
        }
    }

    handleForegroundMessage(payload) {
        console.log('📱 Received foreground message:', payload);
        const { title, body } = payload.notification || {};
        if (title && body) {
            this.showInAppNotification(title, body, 'info');
        }
    }

    showInAppNotification(title, message, type = 'info') {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification-toast notification-${type} slide-in`;
        
        notificationEl.style.cssText = `
            position: fixed !important;
            top: 90px !important;
            right: 20px !important;
            z-index: 1070 !important;
            background: #333;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-left: 4px solid #007bff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
            animation: slideInFromRight 0.3s ease-out;
        `;
        
        notificationEl.innerHTML = `
            <div class="notification-content" style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <div class="notification-title" style="font-weight: 600; margin-bottom: 4px; font-size: 14px;">${title}</div>
                    <div class="notification-message" style="font-size: 13px; opacity: 0.9; line-height: 1.4;">${message}</div>
                </div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()" style="
                    background: none;
                    border: none;
                    color: white;
                    font-size: 18px;
                    cursor: pointer;
                    margin-left: 10px;
                    opacity: 0.7;
                    padding: 0;
                    width: 20px;
                    height: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">×</button>
            </div>
        `;
        
        document.body.appendChild(notificationEl);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.remove();
            }
        }, 5000);
    }

    testNotification() {
        if (Notification.permission === 'granted') {
            const notification = new Notification('NewsHub Test', {
                body: 'Notification system is working!',
                icon: '/assets/logo.png'
            });
        }
    }
}

// Initialize notification service
window.notificationService = new NotificationService();