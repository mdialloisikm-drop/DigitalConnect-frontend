export interface Environment {
  production: boolean;
  apiUrl: string;
  firebase: {
    vapidKey: string;
  };
  reverb: {
    key: string;
    host: string;
    port: number;
    scheme: 'http' | 'https';
    authEndpoint: string;
  };
}
