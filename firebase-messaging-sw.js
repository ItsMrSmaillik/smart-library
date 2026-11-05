
importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.5.0/firebase-messaging-compat.js");

// Firebase configuration
// Скопируй сюда тот же объект firebaseConfig,
// который уже используется в app.js.
firebase.initializeApp({
    apiKey: "AIzaSyAEpLDi1MxEnK4OBdS41Z1SjFiLbx0_G9M",
    authDomain: "smart-library-571ba.firebaseapp.com",
    databaseURL: "https://smart-library-571ba-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-library-571ba",
    storageBucket: "smart-library-571ba.firebasestorage.app",
    messagingSenderId: "711061193508",
    appId: "1:711061193508:web:cd02f03b11124dca3869b1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || "Smart Library";

    const options = {
        body: payload.notification?.body || "Получено новое уведомление",
        icon: "/favicon.ico",
        data: {
            url: "/"
        }
    };

    self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow(event.notification.data?.url || "/")
    );
});
