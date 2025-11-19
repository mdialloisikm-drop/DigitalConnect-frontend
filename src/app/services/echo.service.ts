import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from "../../environments/environment";

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<any>;
  }
}

@Injectable({
  providedIn: 'root'
})
export class EchoService {
  private echo: Echo<any> | null = null;
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public connectionStatus$: Observable<'connected' | 'disconnected' | 'connecting'> = this.connectionStatusSubject.asObservable();

  constructor() {
    window.Pusher = Pusher;
  }

  /**
   * ✅ CORRECTION : Configuration pour Laravel WebSockets local
   */
  public init(authToken: string): void {
    if (this.echo) {
      console.warn('⚠️ Echo déjà initialisé');
      return;
    }

    this.connectionStatusSubject.next('connecting');

    try {
      // ✅ Configuration optimisée pour Laravel WebSockets
      const options = {
        broadcaster: 'pusher',
        key: environment.websocket.key,
        wsHost: environment.websocket.wsHost,
        wsPort: environment.websocket.wsPort,
        wssPort: environment.websocket.wssPort,
        forceTLS: false,
        encrypted: true,
        disableStats: true,
        enabledTransports: ['ws', 'wss'],
        cluster: environment.websocket.cluster,
        authEndpoint: environment.websocket.authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
        },
      };

      console.log('🔧 Configuration Echo:', {
        wsHost: options.wsHost,
        wsPort: options.wsPort,
        authEndpoint: options.authEndpoint
      });

      this.echo = new Echo(options as any);

      // Événements de connexion Pusher
      const pusher = (this.echo as any).connector.pusher;

      pusher.connection.bind('connected', () => {
        console.log('✅ WebSocket connecté');
        this.connectionStatusSubject.next('connected');
      });

      pusher.connection.bind('disconnected', () => {
        console.log('🔌 WebSocket déconnecté');
        this.connectionStatusSubject.next('disconnected');
      });

      pusher.connection.bind('error', (error: any) => {
        console.error('❌ Erreur WebSocket:', error);
        this.connectionStatusSubject.next('disconnected');
      });

      // ✅ AJOUT : Logs pour debugging
      pusher.connection.bind('state_change', (states: any) => {
        console.log('🔄 État WebSocket:', states.previous, '→', states.current);
      });

      console.log('✅ Echo initialisé avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation d\'Echo:', error);
      this.connectionStatusSubject.next('disconnected');
      throw error;
    }
  }

  public getEcho(): Echo<any> {
    if (!this.echo) {
      throw new Error('❌ Echo n\'est pas initialisé. Appelez init() d\'abord.');
    }
    return this.echo;
  }

  public disconnect(): void {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
      this.connectionStatusSubject.next('disconnected');
      console.log('🔌 Echo déconnecté');
    }
  }

  public isConnected(): boolean {
    return this.echo !== null && this.connectionStatusSubject.value === 'connected';
  }

  public reconnect(authToken: string): void {
    this.disconnect();
    setTimeout(() => {
      this.init(authToken);
    }, 1000);
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this.connectionStatusSubject.value;
  }
}
