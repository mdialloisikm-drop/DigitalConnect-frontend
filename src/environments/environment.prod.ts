import { initializeApp } from "firebase/app";
import { Environment } from "./environment.interface";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD5NUBTlvvybOWiHClBAYMvzD1Q2Zo35ks",
  authDomain: "digital-connect-30e60.firebaseapp.com",
  projectId: "digital-connect-30e60",
  storageBucket: "digital-connect-30e60.firebasestorage.app",
  messagingSenderId: "561554871515",
  appId: "1:561554871515:web:ff919a312ac31aed3828fe"
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);

// Configuration de l'environnement de production
export const environment = {
  production: true,
  apiUrl: 'http://127.0.0.1:8000/api/v1',

  websocket: {
    key: 'rkj4nj5mszzp1bitzy9n',
    wsHost: '127.0.0.1',
    wsPort: 6001,
    wssPort: 6001,
    forceTLS: false,
    cluster: 'mt1',
    authEndpoint: 'http://localhost:8000/broadcasting/auth'
  },

  // Configuration Firebase Cloud Messaging
  firebase: {
    vapidKey: 'BGIGwJVQFcJ-pYyBPvGuFajO0uXrcn7u_WZw4elWpI7AzT-dplu242NqF0v7xZtqEIuldYlqIfY6wW-4y_q-4jk'
  },
};
