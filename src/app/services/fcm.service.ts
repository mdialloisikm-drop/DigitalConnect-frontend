import { Injectable } from '@angular/core';
import { getMessaging, getToken, onMessage, deleteToken } from 'firebase/messaging';
import { firebaseApp } from '../../environments/environment';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FcmService {
  private messaging = getMessaging(firebaseApp);
  private currentToken: string | null = null;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Demander la permission et obtenir le token FCM
   */
  async requestPermissionAndGetToken(): Promise<string | null> {
    try {
      if (!('Notification' in window)) {
        console.warn('Ce navigateur ne supporte pas les notifications');
        return null;
      }

      const permission = await Notification.requestPermission();

      if (permission !== 'granted') {
        console.log('Permission de notification refusée');
        return null;
      }

      const token = await getToken(this.messaging, {
        vapidKey: environment.firebase.vapidKey
      });

      if (token) {
        console.log('Token FCM obtenu:', token.substring(0, 20) + '...');
        this.currentToken = token;
        await this.registerTokenOnBackend(token);
        return token;
      } else {
        console.log('Aucun token disponible');
        return null;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du token FCM:', error);
      return null;
    }
  }

  /**
   * Enregistrer le token sur le backend
   */
  private async registerTokenOnBackend(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/fcm/token`, {
          token: token,
          device_type: 'web',
          device_name: this.getDeviceName()
        })
      );

      console.log('Token enregistré sur le backend');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du token:', error);
    }
  }

  /**
   * Écouter les messages en temps réel (quand l'app est ouverte)
   */
  listenForMessages(): void {
    onMessage(this.messaging, (payload) => {
      console.log('Message reçu (app ouverte):', payload);

      if (payload.notification) {
        this.showNotification(
          payload.notification.title || 'Nouvelle notification',
          payload.notification.body || '',
          payload.data
        );
      }
    });
  }

  /**
   * Afficher une notification locale
   */
  private showNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body: body,
        icon: '/logo.png',
        badge: '/logo.png',
        data: data,
        requireInteraction: false
      });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();

        if (data?.url) {
          window.location.href = data.url;
        }

        notification.close();
      };

      setTimeout(() => notification.close(), 5000);
    }
  }

  /**
   * 🔥 MÉTHODE CORRIGÉE: Supprimer le token FCM
   * Ne renvoie plus d'erreur si l'utilisateur est déjà déconnecté
   */
  async deleteToken(): Promise<void> {
    // Si pas de token enregistré, rien à faire
    if (!this.currentToken) {
      console.log('ℹ️ Aucun token FCM à supprimer');
      return;
    }

    try {
      // 1️⃣ Vérifier si l'utilisateur est encore authentifié
      const isAuthenticated = this.authService.isAuthenticated;

      if (isAuthenticated) {
        // 2️⃣ Supprimer du backend SI l'utilisateur est encore connecté
        try {
          await firstValueFrom(
            this.http.delete(`${environment.apiUrl}/fcm/token`, {
              body: { token: this.currentToken }
            })
          );
          console.log('✅ Token FCM supprimé du backend');
        } catch (error: any) {
          // Ignorer les erreurs 401 (l'utilisateur est déjà déconnecté)
          if (error?.status === 401) {
            console.log('ℹ️ Token backend déjà invalidé (401)');
          } else {
            console.warn('⚠️ Erreur backend lors de la suppression du token FCM:', error);
          }
          // Ne pas throw, on continue quand même la suppression locale
        }
      } else {
        console.log('ℹ️ Utilisateur déjà déconnecté, skip suppression backend');
      }

      // 3️⃣ Supprimer localement de Firebase (toujours faire cette étape)
      try {
        await deleteToken(this.messaging);
        console.log('✅ Token FCM supprimé localement');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la suppression locale du token FCM:', error);
      }

      // 4️⃣ Nettoyer la référence locale
      this.currentToken = null;

    } catch (error) {
      // Si une erreur se produit, nettoyer quand même la référence locale
      console.error('❌ Erreur générale lors de la suppression du token FCM:', error);
      this.currentToken = null;
      // Ne pas throw pour éviter de bloquer la déconnexion
    }
  }

  /**
   * Désactiver tous les tokens (optionnel)
   */
  async deactivateAllTokens(): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post(`${environment.apiUrl}/fcm/token/deactivate-all`, {})
      );
      console.log('Tous les tokens ont été désactivés');
    } catch (error) {
      console.error('Erreur lors de la désactivation des tokens:', error);
    }
  }

  /**
   * Obtenir le nom de l'appareil
   */
  private getDeviceName(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Chrome')) return 'Chrome Desktop';
    if (userAgent.includes('Firefox')) return 'Firefox Desktop';
    if (userAgent.includes('Safari')) return 'Safari Desktop';
    if (userAgent.includes('Edge')) return 'Edge Desktop';

    return 'Unknown Browser';
  }

  /**
   * Vérifier si les notifications sont activées
   */
  isNotificationEnabled(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Obtenir le statut de la permission
   */
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }
}
