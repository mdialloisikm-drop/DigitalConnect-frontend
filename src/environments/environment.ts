import { initializeApp } from "firebase/app";

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

// Configuration de l'environnement
export const environment = {
  production: false,
  apiUrl: 'http://127.0.0.1:8000/api/v1',
  firebase: {
    vapidKey: 'BGIGwJVQFcJ-pYyBPvGuFajO0uXrcn7u_WZw4elWpI7AzT-dplu242NqF0v7xZtqEIuldYlqIfY6wW-4y_q-4jk',
  },
  reverb: {
    key: 'a5lacmcsftbjdvpmcdvd',
    host: '127.0.0.1',
    port: 8080,
    scheme: 'http',
    authEndpoint: 'http://127.0.0.1:8000/broadcasting/auth'
  },


};


