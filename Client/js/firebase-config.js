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
            const firebaseApp = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
            const firebaseMessaging = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js');
            const firebaseFirestore = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            this.firebaseModules = {
                app: firebaseApp,
                messaging: firebaseMessaging,
                firestore: firebaseFirestore
            };

            this.app = firebaseApp.initializeApp(firebaseConfig);
            this.messaging = firebaseMessaging.getMessaging(this.app);
            this.db = firebaseFirestore.getFirestore(this.app);

            window.firebase = {
                app: this.app,
                messaging: this.messaging,
                db: this.db,
                modules: this.firebaseModules
            };

            this.isInitialized = true;
            // console.log('✅ Firebase initialized successfully');
            return true;

        } catch (error) {
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
                console.warn('⚠️ This browser does not support desktop notification');
                return false;
            }

            let permission = Notification.permission;
            console.log('🔔 Current Notification Permission:', permission);

            if (permission === 'default') {
                this.showNotificationPrompt(userId, userInterests);
                return false;
            }

            if (permission === 'granted') {
                const result = await this.setupNotifications(userId, userInterests);
                console.log('🔔 Setup Result:', result);
                return result;
            } else {
                console.warn('⚠️ Notifications denied');
                return false;
            }

        } catch (error) {
            console.error('❌ Error in initializeForUser:', error);
            return false;
        }
    }

    showNotificationPrompt(userId, userInterests) {
        const existingPrompt = document.getElementById('notificationPrompt');
        if (existingPrompt) {
            existingPrompt.remove();
        }

        const promptHtml = `
            <div id="notificationPrompt" style="
                position: fixed; 
                top: 80px; 
                right: 20px; 
                z-index: 10000;
                background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
                color: white;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                max-width: 350px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
                animation: slideIn 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; margin-bottom: 12px;">
                    <span style="font-size: 24px; margin-right: 10px;">🔔</span>
                    <h6 style="margin: 0; font-weight: 600;">Stay Updated!</h6>
                </div>
                <p style="margin: 0 0 15px 0; font-size: 14px; line-height: 1.4;">
                    Get notified when someone likes or comments on your posts
                </p>
                <div style="display: flex; gap: 10px;">
                    <button id="enableNotifications" style="
                        background: white; 
                        color: #4F46E5; 
                        border: none; 
                        padding: 8px 16px; 
                        border-radius: 6px; 
                        font-weight: 600;
                        cursor: pointer;
                        font-size: 14px;
                    ">Enable Notifications</button>
                    <button id="dismissPrompt" style="
                        background: transparent; 
                        color: white; 
                        border: 1px solid rgba(255,255,255,0.3); 
                        padding: 8px 16px; 
                        border-radius: 6px; 
                        cursor: pointer;
                        font-size: 14px;
                    ">Maybe Later</button>
                </div>
            </div>
            <style>
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(100px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', promptHtml);

        document.getElementById('enableNotifications').onclick = async () => {
            try {
                const permission = await Notification.requestPermission();

                if (permission === 'granted') {
                    await this.setupNotifications(userId, userInterests);
                    document.getElementById('notificationPrompt').remove();

                    if (window.showAlert) {
                        window.showAlert('success', 'Notifications enabled');
                    }
                } else {
                    document.getElementById('notificationPrompt').remove();
                }
            } catch (error) {
                document.getElementById('notificationPrompt').remove();
            }
        };

        document.getElementById('dismissPrompt').onclick = () => {
            document.getElementById('notificationPrompt').remove();
        };

        setTimeout(() => {
            const prompt = document.getElementById('notificationPrompt');
            if (prompt) {
                prompt.remove();
            }
        }, 20000);
    }

    async setupNotifications(userId, userInterests) {
        try {
            // Use our wrapper getToken method which handles the SW registration correctly
            const token = await this.getToken();

            if (token) {
                console.log('✅ FCM Token obtained:', token.substring(0, 20) + '...');
                localStorage.setItem('fcmToken', token);

                const registered = await this.registerTokenWithBackend(token, userId);

                if (registered) {
                    await this.setupRealtimeListeners(userInterests);

                    this.firebaseModules.messaging.onMessage(this.messaging, (payload) => {
                        console.log('🔔 Foreground message received:', payload);
                        alert(`🔔 Notification Received:\n${payload.notification.title}\n${payload.notification.body}`);
                        this.handleForegroundMessage(payload);
                    });

                    console.log('✅ Notifications setup complete');
                    return true;
                } else {
                    console.error('❌ Failed to register token with backend');
                }
            } else {
                console.warn('⚠️ No registration token available. Request permission to generate one.');
            }

            return false;
        } catch (error) {
            console.error('❌ Error in setupNotifications:', error);
            return false;
        }
    }

    async registerServiceWorker() {
        console.log('🔔 registerServiceWorker - START');
        try {
            if ('serviceWorker' in navigator) {
                // Register SW at root scope to ensure compatibility with Firebase
                // console.log('🔔 Attempting to register SW at /firebase-messaging-sw.js');
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('✅ Service Worker registered with scope:', registration.scope);

                // Wait for the Service Worker to be active to avoid "no active Service Worker" error
                if (registration.installing || registration.waiting) {
                    console.log('⏳ Waiting for Service Worker to activate...');
                    await new Promise(resolve => {
                        const checkActive = () => {
                            if (registration.active) {
                                resolve();
                            } else {
                                setTimeout(checkActive, 100);
                            }
                        };
                        checkActive();
                    });
                    console.log('✅ Service Worker is now ACTIVE');
                }

                // Double check with .ready
                await navigator.serviceWorker.ready;

                return registration;
            } else {
                throw new Error('Service Worker not supported');
            }
        } catch (error) {
            console.error('❌ registerServiceWorker FAILED:', error);
            throw error;
        }
    }

    async getToken() {
        console.log('🔔 getToken - START');
        try {
            const registration = await this.registerServiceWorker();
            console.log('🔔 Requesting FCM token (using SW scope)...');

            // Pass the registration to getToken so it uses the correct SW
            const token = await this.firebaseModules.messaging.getToken(this.messaging, {
                serviceWorkerRegistration: registration,
                vapidKey: 'BBzIJz2Hrx6LDER7EApmNDqy2gHhKuV3R8oUG3nX7sCAR-VckGJ_rgydYldzXntwwL0NxaTqFKU-HYoomm2_YDI'
            });

            console.log('✅ getToken - SUCCESS. Token length:', token ? token.length : 0);
            return token;
        } catch (error) {
            console.error('❌ getToken FAILED:', error);
            return null;
        }
    }

    async registerTokenWithBackend(token, userId) {
        try {
            const baseUrl = window.API_BASE_URL || 'http://localhost:5121/api';
            console.log(`🔔 Sending token to backend: ${baseUrl}/Notification/register-token`);

            const response = await fetch(`${baseUrl}/Notification/register-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Token: token,
                    UserId: parseInt(userId),
                    DeviceType: 'web',
                    UserAgent: navigator.userAgent
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Backend registration failed: ${response.status} ${response.statusText}`, errorText);
                return false;
            }

            // console.log('✅ Token registered with backend');
            return true;
        } catch (error) {
            console.error('❌ Error sending token to backend:', error);
            return false;
        }
    }


    async setupRealtimeListeners(userInterests) {
        try {
            // Future: Add Firestore listeners here
        } catch (error) {
            // Silent error handling
        }
    }

    handleForegroundMessage(payload) {
        // console.log('📱 Received foreground message:', payload);
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

        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInFromRight {
                    from { 
                        opacity: 0; 
                        transform: translateX(100px); 
                    }
                    to { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                }
                @keyframes slideOutToRight {
                    from { 
                        opacity: 1; 
                        transform: translateX(0); 
                    }
                    to { 
                        opacity: 0; 
                        transform: translateX(100px); 
                    }
                }
                .slide-out {
                    animation: slideOutToRight 0.3s ease-in forwards;
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notificationEl);

        setTimeout(() => {
            if (notificationEl.parentElement) {
                notificationEl.classList.add('slide-out');
                setTimeout(() => notificationEl.remove(), 300);
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

    cleanup() {
        this.unsubscribers.forEach(unsub => unsub());
        this.unsubscribers = [];
        this.currentUser = null;
    }
}

window.NotificationService = new NotificationService();