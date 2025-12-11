import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Subject, takeUntil} from "rxjs";
import {AuthService} from "../../services/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {LoginData} from "../../models/auth";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit{
  loginForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  returnUrl = '/';

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.checkExistingAuth();
    this.getReturnUrl();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialise le formulaire de connexion avec les validations
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      rememberMe: [false]
    });
  }

  /**
   * Vérifie si l'utilisateur est déjà connecté
   */
  private checkExistingAuth(): void {
    if (this.authService.isAuthenticated) {
      this.redirectToReturnUrl();
    }
  }

  /**
   * Récupère l'URL de retour depuis les paramètres
   */
  private getReturnUrl(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  /**
   * Gère la soumission du formulaire
   */
  onSubmit(): void {
    // Marquer tous les champs comme touchés pour afficher les erreurs
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      this.errorMessage = 'Veuillez corriger les erreurs dans le formulaire.';
      return;
    }

    this.clearMessages();
    this.performLogin();
  }

  /**
   * Effectue la connexion via le service d'authentification
   */
  private performLogin(): void {
    this.isLoading = true;

    const loginData: LoginData = {
      email: this.loginForm.value.email.trim().toLowerCase(),
      password: this.loginForm.value.password
    };

    this.authService.login(loginData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleLoginSuccess(),
        error: (error) => this.handleLoginError(error)
      });
  }

  /**
   * Gère le succès de la connexion
   */
  private handleLoginSuccess(): void {
    this.isLoading = false;
    this.successMessage = 'Connexion réussie !';

    // Effacer le formulaire
    this.loginForm.reset();

    // Redirection après un court délai pour afficher le message de succès
    setTimeout(() => {
      this.redirectToReturnUrl();
    }, 1000);
  }

  /**
   * Gère les erreurs de connexion
   */
  private handleLoginError(error: any): void {
    this.isLoading = false;

    if (error.status === 401) {
      this.errorMessage = 'Email ou mot de passe incorrect. Veuillez réessayer.';
    } else if (error.status === 403) {
      this.errorMessage = 'Votre compte a été suspendu. Contactez l\'administrateur.';
    } else if (error.status === 0) {
      this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
    } else if (error.error) {
      this.errorMessage = error.error;
    } else {
      this.errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
    }

    // Effacer le message d'erreur après 5 secondes
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Redirige l'utilisateur en fonction de son rôle
   */
  private redirectToReturnUrl(): void {
    const user = this.authService.currentUserValue;

    if (!user) {
      this.router.navigate(['/']);
      return;
    }

    // Si returnUrl existe et n'est pas la page de login, rediriger vers cette URL
    if (this.returnUrl && this.returnUrl !== '/' && this.returnUrl !== '/login') {
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Sinon, rediriger selon le rôle
    this.redirectBasedOnRole(user.user_type);
  }

  /**
   * Redirige selon le type d'utilisateur
   */
  private redirectBasedOnRole(userType: string): void {
    const routes: { [key: string]: string } = {
      'admin': '/admin/dashboard',
      'client': '/client/dashboard',
      'freelance': '/freelance/dashboard'
    };

    const route = routes[userType] || '/';
    this.router.navigate([route]);
  }

  /**
   * Basculer la visibilité du mot de passe
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Vérifie si un champ est invalide et a été touché
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Vérifie si un champ est valide et a été touché
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  /**
   * Marque tous les champs du formulaire comme touchés
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Efface les messages d'erreur et de succès
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Récupère le message d'erreur spécifique pour un champ
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `Le champ ${fieldName === 'email' ? 'email' : 'mot de passe'} est requis.`;
    }

    if (field.errors['email'] || field.errors['pattern']) {
      return 'Format d\'email invalide.';
    }

    if (field.errors['minlength']) {
      return `Le mot de passe doit contenir au moins ${field.errors['minlength'].requiredLength} caractères.`;
    }

    return 'Erreur de validation.';
  }
}
