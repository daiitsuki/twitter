importScripts(
  "https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBeM_8ldWDc8TKjDNdkQx4tFfJYCxmEk8I",
  authDomain: "twitter-2b855.firebaseapp.com",
  projectId: "twitter-2b855",
  storageBucket: "twitter-2b855.appspot.com",
  messagingSenderId: "761759590132",
  appId: "1:761759590132:web:36e1aa2e227c49330ce0a1",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] 백그라운드 메시지 수신: ", payload);

  const notificationTitle = payload.notification?.title || "알림";
  const notificationOptions = {
    body: payload.notification?.body || "메시지가 도착했습니다.",
    icon: "/logo192.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
