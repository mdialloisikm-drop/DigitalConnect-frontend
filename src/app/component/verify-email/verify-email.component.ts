import {Component, OnInit} from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrl: './verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit {
  email: string = '';
  isResending = false;
  resendMessage = '';
  resendError = '';
  canResend = true;
  countdown = 0;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Récupérer l'email depuis localStorage
    this.email = localStorage.getItem('pending_verification_email') || '';

    if (!this.email) {
      // Si pas d'email, rediriger vers l'inscription
      this.router.navigate(['/register']);
    }
  }

  /**
   * ✅ Renvoyer l'email de vérification
   */
  resendVerificationEmail(): void {
    if (!this.canResend || this.isResending) {
      return;
    }

    this.isResending = true;
    this.resendMessage = '';
    this.resendError = '';

    this.authService.resendVerificationEmail({ email: this.email }).subscribe({
      next: (response) => {
        this.isResending = false;
        this.resendMessage = response.message;

        // ✅ Désactiver le bouton pendant 60 secondes
        this.startCountdown(60);

        // ✅ Masquer le message après 5 secondes
        setTimeout(() => {
          this.resendMessage = '';
        }, 5000);
      },
      error: (error) => {
        this.isResending = false;
        this.resendError = error.error || 'Impossible de renvoyer l\'email';

        setTimeout(() => {
          this.resendError = '';
        }, 5000);
      }
    });
  }

  /**
   * ✅ Démarrer le compte à rebours
   */
  private startCountdown(seconds: number): void {
    this.canResend = false;
    this.countdown = seconds;

    const interval = setInterval(() => {
      this.countdown--;

      if (this.countdown <= 0) {
        clearInterval(interval);
        this.canResend = true;
      }
    }, 1000);
  }

  goToLogin(): void {
    // ✅ Nettoyer le localStorage
    localStorage.removeItem('pending_verification_email');
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    // ✅ Nettoyer le localStorage
    localStorage.removeItem('pending_verification_email');
    this.router.navigate(['/']);
  }
}
