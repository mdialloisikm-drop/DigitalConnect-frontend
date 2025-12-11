import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isEditingProfile = false;
  isChangingPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  profileForm = {
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    title: '',
    description: '',
    hourly_rate: null as number | null,
    experience_years: null as number | null,
    availability: 'available' as 'available' | 'busy' | 'unavailable',
    company_name: '',
    company_description: ''
  };

  passwordForm = {
    current_password: '',
    password: '',
    password_confirmation: ''
  };

  successMessage = '';
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();
  private readonly apiUrl = environment.apiUrl;

  constructor(
    private readonly authService: AuthService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCurrentUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          if (user) {
            this.currentUser = user;
            console.log('👤 Utilisateur chargé:', user);
            this.initializeProfileForm();
          }
        },
        error: (error) => {
          console.error('Erreur lors du chargement de l\'utilisateur:', error);
        }
      });
  }

  private initializeProfileForm(): void {
    if (this.currentUser) {
      this.profileForm = {
        full_name: this.currentUser.full_name || '',
        email: this.currentUser.email || '',
        phone: this.currentUser.phone || '',
        city: this.currentUser.city || '',
        country: this.currentUser.country || '',
        title: this.currentUser.freelance?.title || '',
        description: this.currentUser.freelance?.description || '',
        hourly_rate: this.currentUser.freelance?.hourly_rate || null,
        experience_years: this.currentUser.freelance?.experience_years || null,
        availability: this.currentUser.freelance?.availability || 'available',
        company_name: this.currentUser.client?.company_name || '',
        company_description: this.currentUser.client?.company_description || ''
      };
      console.log('📝 Formulaire initialisé:', this.profileForm);
    }
  }

  getUserAvatar(): string {
    if (this.previewUrl) {
      return this.previewUrl;
    }

    if (this.currentUser?.avatar) {
      if (this.currentUser.avatar.startsWith('http://') || this.currentUser.avatar.startsWith('https://')) {
        return this.currentUser.avatar;
      }
      return `http://localhost:8000/storage/avatars/${this.currentUser.avatar}`;
    }

    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=200`;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=200`;
  }

  startEditingProfile(): void {
    this.isEditingProfile = true;
    this.isChangingPassword = false;
    this.clearMessages();
  }

  startChangingPassword(): void {
    this.isChangingPassword = true;
    this.isEditingProfile = false;
    this.clearMessages();
    this.resetPasswordForm();
  }

  cancelEdit(): void {
    this.isEditingProfile = false;
    this.isChangingPassword = false;
    this.initializeProfileForm();
    this.resetPasswordForm();
    this.clearMessages();
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Veuillez sélectionner une image valide';
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        this.errorMessage = 'L\'image ne doit pas dépasser 2MB';
        return;
      }

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target?.result as string;
      };
      reader.readAsDataURL(file);

      this.clearMessages();
    }
  }

  saveProfile(): void {
    this.clearMessages();

    console.log('📤 ========== DÉBUT SAUVEGARDE PROFIL ==========');
    console.log('👤 Type utilisateur:', this.currentUser?.user_type);
    console.log('📝 Données du formulaire:', this.profileForm);

    const formData = new FormData();

    // Champs de base
    formData.append('full_name', this.profileForm.full_name);
    formData.append('email', this.profileForm.email);

    if (this.profileForm.phone) {
      formData.append('phone', this.profileForm.phone);
    }
    if (this.profileForm.city) {
      formData.append('city', this.profileForm.city);
    }
    if (this.profileForm.country) {
      formData.append('country', this.profileForm.country);
    }

    // Champs spécifiques freelance
    if (this.isFreelance()) {
      console.log('👨‍💻 Ajout des champs FREELANCE');
      if (this.profileForm.title) {
        formData.append('title', this.profileForm.title);
      }
      if (this.profileForm.description) {
        formData.append('description', this.profileForm.description);
      }
      if (this.profileForm.hourly_rate !== null) {
        formData.append('hourly_rate', this.profileForm.hourly_rate.toString());
      }
      if (this.profileForm.experience_years !== null) {
        formData.append('experience_years', this.profileForm.experience_years.toString());
      }
      formData.append('availability', this.profileForm.availability);
    }

    // Champs spécifiques client
    if (this.isClient()) {
      console.log('🏢 Ajout des champs CLIENT');
      if (this.profileForm.company_name) {
        formData.append('company_name', this.profileForm.company_name);
      }
      if (this.profileForm.company_description) {
        formData.append('company_description', this.profileForm.company_description);
      }
    }

    // Avatar
    if (this.selectedFile) {
      formData.append('avatar', this.selectedFile);
      console.log('📷 Avatar sélectionné:', this.selectedFile.name);
    }

    // IMPORTANT: Ajouter _method=PUT pour Laravel
    formData.append('_method', 'PUT');

    console.log('🚀 Envoi requête POST (avec _method=PUT) vers:', `${this.apiUrl}/user/profile`);

    // Utiliser POST avec _method=PUT pour contourner la limitation de FormData
    this.http.post<{ message: string; user: User }>(`${this.apiUrl}/user/profile`, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ ========== RÉPONSE REÇUE ==========');
          console.log('📨 Réponse complète:', response);
          console.log('💬 Message:', response.message);
          console.log('👤 User reçu:', response.user);

          this.successMessage = response.message;
          this.currentUser = response.user;
          this.authService.updateCurrentUser(response.user);
          this.isEditingProfile = false;
          this.selectedFile = null;
          this.previewUrl = null;

          this.initializeProfileForm();

          console.log('✅ Profil mis à jour dans le composant');
          console.log('✅ ========== FIN SAUVEGARDE (SUCCÈS) ==========');

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('❌ ========== ERREUR HTTP ==========');
          console.error('🔴 Erreur complète:', error);
          console.error('📊 Statut HTTP:', error.status);
          console.error('💬 Message:', error.message);
          console.error('📦 Error body:', error.error);

          let errorMsg = 'Erreur lors de la mise à jour du profil';

          if (error.status === 422 && error.error?.errors) {
            console.error('⚠️ Erreurs de validation:', error.error.errors);
            const validationErrors = Object.values(error.error.errors).flat() as string[];
            errorMsg = validationErrors.join(', ');
          } else if (error.error?.error) {
            errorMsg = error.error.error;
          } else if (error.error?.message) {
            errorMsg = error.error.message;
          } else if (error.status === 401) {
            errorMsg = 'Session expirée, veuillez vous reconnecter';
          } else if (error.status === 500) {
            errorMsg = 'Erreur serveur, veuillez réessayer';
          }

          this.errorMessage = errorMsg;
          console.error('❌ Message d\'erreur affiché:', errorMsg);
          console.error('❌ ========== FIN SAUVEGARDE (ERREUR) ==========');
        }
      });
  }

  changePassword(): void {
    this.clearMessages();

    if (!this.passwordForm.current_password || !this.passwordForm.password || !this.passwordForm.password_confirmation) {
      this.errorMessage = 'Tous les champs sont obligatoires';
      return;
    }

    if (this.passwordForm.password !== this.passwordForm.password_confirmation) {
      this.errorMessage = 'Les nouveaux mots de passe ne correspondent pas';
      return;
    }

    if (this.passwordForm.password.length < 8) {
      this.errorMessage = 'Le nouveau mot de passe doit contenir au moins 8 caractères';
      return;
    }

    this.http.put<{ message: string }>(`${this.apiUrl}/user/change-password`, this.passwordForm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.isChangingPassword = false;
          this.resetPasswordForm();

          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        },
        error: (error) => {
          console.error('Erreur lors du changement de mot de passe:', error);
          this.errorMessage = error.error?.error || error.error?.message || 'Erreur lors du changement de mot de passe';
        }
      });
  }

  private resetPasswordForm(): void {
    this.passwordForm = {
      current_password: '',
      password: '',
      password_confirmation: ''
    };
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  isFreelance(): boolean {
    return this.currentUser?.user_type === 'freelance';
  }

  isClient(): boolean {
    return this.currentUser?.user_type === 'client';
  }

  getUserTypeLabel(): string {
    const labels: Record<string, string> = {
      'freelance': 'Freelance',
      'client': 'Client',
      'admin': 'Administrateur'
    };
    return this.currentUser?.user_type ? labels[this.currentUser.user_type] : 'Utilisateur';
  }

  getUserTypeBadgeClass(): string {
    const classes: Record<string, string> = {
      'freelance': 'bg-green-100 text-green-800',
      'client': 'bg-blue-100 text-blue-800',
      'admin': 'bg-purple-100 text-purple-800'
    };
    return this.currentUser?.user_type ? classes[this.currentUser.user_type] : 'bg-gray-100 text-gray-800';
  }

  getAvailabilityLabel(availability: string | undefined): string {
    if (!availability) return 'Non défini';
    const labels: Record<string, string> = {
      'available': 'Disponible',
      'busy': 'Occupé',
      'unavailable': 'Indisponible'
    };
    return labels[availability] || availability;
  }
}
