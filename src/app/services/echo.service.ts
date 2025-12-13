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
  private echo:  Echo<any> | null = null;
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'disconnected' | 'connecting'>('disconnected');
  public connectionStatus$: Observable<'connected' | 'disconnected' | 'connecting'> = this.connectionStatusSubject.asObservable();

  constructor() {
    window.Pusher = Pusher;
  }

  /**
   * Configuration pour Laravel Reverb
   */
  public init(authToken: string): void {
    if (this.echo) {
      console.warn('⚠️ Echo déjà initialisé');
      return;
    }

    this.connectionStatusSubject.next('connecting');

    try {
      const useTLS = environment.reverb.scheme === 'https';

      const options = {
        broadcaster: 'pusher',
        key: environment.reverb.key,
        wsHost: environment.reverb.host,
        wsPort: environment.reverb.port,
        wssPort: environment.reverb.port,
        forceTLS: useTLS,
        encrypted: useTLS,
        disableStats: true,
        enabledTransports: useTLS ? ['wss'] : ['ws'],
        cluster: 'mt1',
        authEndpoint: environment.reverb.authEndpoint,
        auth: {
          headers: {
            Authorization: `Bearer ${authToken}`,
            Accept: 'application/json',
          },
        },
      };

      console.log('🔧 Configuration Echo pour Reverb:', {
        wsHost: options.wsHost,
        wsPort: options.wsPort,
        forceTLS: options. forceTLS,
        enabledTransports: options.enabledTransports,
        authEndpoint: options.authEndpoint
      });

      this.echo = new Echo(options as any);

      // Événements de connexion Pusher
      const pusher = (this.echo as any).connector.pusher;

      pusher.connection.bind('connected', () => {
        console.log('✅ Reverb WebSocket connecté');
        this.connectionStatusSubject.next('connected');
      });

      pusher. connection.bind('disconnected', () => {
        console.log('🔌 Reverb WebSocket déconnecté');
        this.connectionStatusSubject. next('disconnected');
      });

      pusher.connection. bind('error', (error:  any) => {
        console.error('❌ Erreur Reverb WebSocket:', error);
        this.connectionStatusSubject.next('disconnected');
      });

      pusher.connection. bind('state_change', (states: any) => {
        console.log('🔄 État Reverb WebSocket:', states. previous, '→', states.current);
      });

      console.log('✅ Echo initialisé avec Reverb');
    } catch (error) {
      console. error('❌ Erreur lors de l\'initialisation d\'Echo:', error);
      this.connectionStatusSubject.next('disconnected');
      throw error;
    }
  }

  public getEcho(): Echo<any> {
    if (!this.echo) {
      throw new Error('❌ Echo n\'est pas initialisé.  Appelez init() d\'abord.');
    }
    return this.echo;
  }

  public disconnect(): void {
    if (this. echo) {
      this.echo.disconnect();
      this.echo = null;
      this. connectionStatusSubject. next('disconnected');
      console.log('🔌 Echo déconnecté');
    }
  }

  public isConnected(): boolean {
    return this. echo !== null && this.connectionStatusSubject.value === 'connected';
  }

  public reconnect(authToken: string): void {
    this.disconnect();
    setTimeout(() => {
      this.init(authToken);
    }, 1000);
  }

  public getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    return this. connectionStatusSubject. value;
  }
}
