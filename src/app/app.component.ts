import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from "./services/auth.service";
import { Subscription } from "rxjs";
import { EchoService } from "./services/echo.service";
import { FcmService } from './services/fcm.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'digital-connect';
  private subscription?: Subscription;

  constructor(
    private authService: AuthService,
    private echoService: EchoService,
    private fcmService: FcmService,
  ) {}

  ngOnInit(): void {
    // ✅ UNE SEULE souscription qui gère Echo ET FCM
    this.subscription = this.authService.currentUser$.subscribe(user => {
      if (user && this.authService.token) {
        console.log('✅ Utilisateur connecté');

        // Initialiser Echo
        try {
          this.echoService.init(this.authService.token);
          console.log('✅ Echo initialisé');
        } catch (error) {
          console.error('❌ Erreur init Echo:', error);
        }

        // Initialiser FCM
        this.initializeFCM();

      } else if (!user) {
        console.log('🔴 Utilisateur déconnecté');
        this.echoService.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.echoService.disconnect();
  }

  private async initializeFCM() {
    try {
      const token = await this.fcmService.requestPermissionAndGetToken();

      if (token) {
        console.log('✅ Notifications activées avec succès');
        this.fcmService.listenForMessages();
      } else {
        console.log('⚠️ Notifications non activées');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation des notifications:', error);
    }
  }
}
