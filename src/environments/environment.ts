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
  apiUrl: 'https://api.digitalconnects.live/api/v1',
  firebase: {
    vapidKey: 'BGIGwJVQFcJ-pYyBPvGuFajO0uXrcn7u_WZw4elWpI7AzT-dplu242NqF0v7xZtqEIuldYlqIfY6wW-4y_q-4jk',
  },
  reverb: {
    key: 'egMjAAkvX5AN48Eqz7z5',
    host: 'ws-a099a723-fdb7-4da2-a4b7-d5e65124ea04-reverb.laravel.cloud',
    port: 443,
    scheme: 'https',
    authEndpoint: 'https://digitalconnect-backend-development-mr1vru.laravel.cloud/api/v1/broadcasting/auth'
  },
  s3Url: 'https://eu-north-1.console.aws.amazon.com'


};


