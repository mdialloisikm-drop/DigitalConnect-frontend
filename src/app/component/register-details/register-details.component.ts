import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";
import {RegisterData} from "../../models/auth";

@Component({
  selector: 'app-register-details',
  templateUrl: './register-details.component.html',
  styleUrl: './register-details.component.css'
})
export class RegisterDetailsComponent implements OnInit {
  currentStep: number = 1;
  accountType: 'client' | 'freelance' = 'client';

  personalInfoForm!: FormGroup;
  additionalInfoForm!: FormGroup;

  showPassword = false;
  showPasswordConfirmation = false;
  isLoading = false;
  errorMessage = '';
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Récupérer le type de compte depuis les paramètres
    this.route.queryParams.subscribe(params => {
      this.accountType = params['type'] || 'client';
      this.initializeForms();
    });
  }

  initializeForms(): void {
    // Formulaire des informations personnelles
    this.personalInfoForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^[0-9+\s()-]+$/)]],
      city: [''],
      country: [''],
      password: ['', [Validators.required, Validators.minLength(6)]], // ✅ min 6 selon backend
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Formulaire des informations supplémentaires
    if (this.accountType === 'client') {
      this.additionalInfoForm = this.fb.group({
        company_name: [''],
        company_description: ['']
      });
    } else {
      this.additionalInfoForm = this.fb.group({
        title: ['', Validators.required],
        description: [''],
        hourly_rate: ['', [Validators.min(0)]],
        experience_years: ['', [Validators.min(0), Validators.max(50)]]
      });
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password');
    const confirmPassword = group.get('password_confirmation');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmationVisibility(): void {
    this.showPasswordConfirmation = !this.showPasswordConfirmation;
  }

  /**
   * ✅ Gérer la sélection de l'avatar
   */
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image valide';
        return;
      }

      // Vérifier la taille (max 2MB selon backend)
      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'L\'image ne doit pas dépasser 2 Mo';
        return;
      }

      this.selectedAvatar = file;

      // Prévisualiser l'image
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);

      this.errorMessage = '';
    }
  }

  /**
   * ✅ Supprimer l'avatar sélectionné
   */
  removeAvatar(): void {
    this.selectedAvatar = null;
    this.avatarPreview = null;
  }

  nextStep(): void {
    if (this.currentStep === 1 && this.personalInfoForm.valid) {
      this.currentStep = 2;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousStep(): void {
    if (this.currentStep === 2) {
      this.currentStep = 1;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  isFieldValid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.personalInfoForm.invalid || this.additionalInfoForm.invalid) {
      this.markFormGroupTouched(this.personalInfoForm);
      this.markFormGroupTouched(this.additionalInfoForm);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // ✅ Préparer les données selon l'interface RegisterData
    const registerData: RegisterData = {
      ...this.personalInfoForm.value,
      ...this.additionalInfoForm.value,
      user_type: this.accountType
    };

    // ✅ Ajouter l'avatar si sélectionné
    if (this.selectedAvatar) {
      registerData.avatar = this.selectedAvatar;
    }

    // ✅ Utiliser le service AuthService
    this.authService.register(registerData).subscribe({
      next: (response) => {
        // ✅ Stocker l'email pour la page de vérification
        localStorage.setItem('pending_verification_email', registerData.email);

        // ✅ Rediriger vers la page de vérification
        this.router.navigate(['/register/verify-email']);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error || 'Une erreur est survenue lors de l\'inscription';
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
