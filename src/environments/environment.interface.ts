export interface Environment {
  production: boolean;
  apiUrl: string;
  firebase: {
    vapidKey: string;
  };
  websocket: {
    key: string;
    wsHost: string;
    wsPort: number;
    wssPort: number;
    forceTLS: boolean;
    cluster: string;
    authEndpoint: string;
  };
}
