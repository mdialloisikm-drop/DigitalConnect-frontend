import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-email-confirmed',
  templateUrl: './email-confirmed.component.html',
  styleUrl: './email-confirmed.component.css'
})
export class EmailConfirmedComponent implements OnInit {
  isVerifying = true;
  isSuccess = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // ✅ Récupérer email et token depuis l'URL
    this.route.queryParams.subscribe(params => {
      const email = params['email'];
      const token = params['token'];

      if (!email || !token) {
        this.isVerifying = false;
        this.errorMessage = 'Lien de vérification invalide';
        return;
      }

      // ✅ Vérifier l'email
      this.verifyEmail(email, token);
    });
  }

  verifyEmail(email: string, token: string): void {
    this.authService.verifyEmail({ email, token }).subscribe({
      next: (response) => {
        this.isVerifying = false;
        this.isSuccess = true;
        this.successMessage = response.message;

        // ✅ Rediriger vers login après 3 secondes
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.isVerifying = false;
        this.isSuccess = false;
        this.errorMessage = error.error || 'Erreur lors de la vérification';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToHome(): void {
    this.router.navigate(['/']);
  }
}
