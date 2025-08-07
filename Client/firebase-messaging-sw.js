// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBaQvw0SPblRIdc_PZN8L2uxQSJI7jGbHQ",
  authDomain: "newshub-aaa5c.firebaseapp.com",
  projectId: "newshub-aaa5c",
  storageBucket: "newshub-aaa5c.firebasestorage.app",
  messagingSenderId: "610570159104",
  appId: "1:610570159104:web:4114a16df0ed20fc9184e5",
  measurementId: "G-RC6XYMVT61"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('📱 Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || 'NewsHub Notification';
    const notificationOptions = {
        body: payload.notification?.body || 'You have a new notification',
        icon: '/assets/logo.png',
        badge: '/assets/notification-badge.png',
        tag: payload.data?.type || 'news-notification',
        data: payload.data,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/assets/view-icon.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        requireInteraction: payload.data?.priority === 'high'
    };
    
    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    console.log('🔔 Notification clicked:', event);
    event.notification.close();
    
    const action = event.action;
    const data = event.notification.data || {};
    
    if (action === 'view' || !action) {
        let url = '/news.html';
        
        if (data.type === 'comment') {
            url = '/shared.html';
        } else if (data.type === 'breaking-news') {
            url = '/news.html';
        } else if (data.url) {
            url = data.url;
        }
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then((clientList) => {
                    for (const client of clientList) {
                        if (client.url.includes(url.split('?')[0]) && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    
                    if (clients.openWindow) {
                        return clients.openWindow(url);
                    }
                })
        );
    }
});

self.addEventListener('push', (event) => {
    console.log('📱 Push event received:', event);
    if (event.data) {
        const data = event.data.json();
        console.log('📱 Push data:', data);
    }
});

self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('🔧 Service Worker activating...');
    event.waitUntil(clients.claim());
});