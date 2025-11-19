import {Component, OnInit} from '@angular/core';
import {Service} from "../../models/service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {AuthService} from "../../services/auth.service";
import {OrderService} from "../../services/order.service";

interface OrderFormData {
  requirements: string;
  attachments: File[];
}

interface FormErrors {
  requirements: string;
  attachments: string;
  general: string;
}

@Component({
  selector: 'app-service-detail',
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.css'
})
export class ServiceDetailComponent implements OnInit{
  service?: Service;
  loading = true;
  error = false;
  currentImageIndex = 0;

  // État du modal de commande
  showOrderModal = false;
  orderProcessing = false;

  // Données du formulaire
  orderForm: OrderFormData = {
    requirements: '',
    attachments: []
  };

  // Erreurs de validation
  formErrors: FormErrors = {
    requirements: '',
    attachments: '',
    general: ''
  };

  // Messages de succès/erreur
  successMessage = '';
  errorMessage = '';

  // Informations sur les fichiers
  readonly maxFiles = 5;
  readonly maxFileSize = 10 * 1024 * 1024; // 10 MB
  readonly allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg', 'image/jpg', 'image/png', 'application/zip', 'application/x-rar-compressed'];



  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private orderService: OrderService,
    public authService: AuthService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.loadService(id);
  }

  loadService(id: number) {
    this.loading = true;
    this.apiService.getService(id).subscribe({
      next: (service) => {
        this.service = service;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading service:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  /**
   * Ouvre le modal de commande
   */
  openOrderModal(): void {
    if (!this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.currentUserValue?.user_type !== 'client') {
      this.errorMessage = 'Seuls les clients peuvent commander des services';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    this.showOrderModal = true;
    this.resetOrderForm();
  }

  /**
   * Ferme le modal de commande
   */
  closeOrderModal(): void {
    this.showOrderModal = false;
    this.resetOrderForm();
  }

  /**
   * Réinitialise le formulaire de commande
   */
  private resetOrderForm(): void {
    this.orderForm = {
      requirements: '',
      attachments: []
    };
    this.formErrors = {
      requirements: '',
      attachments: '',
      general: ''
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Gère la sélection des fichiers
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.formErrors.attachments = '';

    // Validation du nombre de fichiers
    if (this.orderForm.attachments.length + files.length > this.maxFiles) {
      this.formErrors.attachments = `Vous ne pouvez joindre que ${this.maxFiles} fichiers maximum`;
      return;
    }

    // Validation de chaque fichier
    for (const file of files) {
      // Vérifier le type
      if (!this.allowedTypes.includes(file.type)) {
        this.formErrors.attachments = `Le fichier ${file.name} n'est pas un format autorisé`;
        return;
      }

      // Vérifier la taille
      if (file.size > this.maxFileSize) {
        this.formErrors.attachments = `Le fichier ${file.name} dépasse la taille maximale de 10 Mo`;
        return;
      }

      this.orderForm.attachments.push(file);
    }

    // Réinitialiser l'input
    input.value = '';
  }

  /**
   * Supprime un fichier de la liste
   */
  removeFile(index: number): void {
    this.orderForm.attachments.splice(index, 1);
    this.formErrors.attachments = '';
  }

  /**
   * Formate la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Obtient l'icône pour un type de fichier
   */
  getFileIcon(file: File): string {
    if (file.type.startsWith('image/')) return 'fa-file-image';
    if (file.type.includes('pdf')) return 'fa-file-pdf';
    if (file.type.includes('word') || file.type.includes('document')) return 'fa-file-word';
    if (file.type.includes('zip') || file.type.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
  }

  /**
   * Valide le formulaire
   */
  private validateForm(): boolean {
    this.formErrors = {
      requirements: '',
      attachments: '',
      general: ''
    };

    let isValid = true;

    // Validation des requirements (optionnel mais max 2000 caractères)
    if (this.orderForm.requirements && this.orderForm.requirements.length > 2000) {
      this.formErrors.requirements = 'Les exigences ne doivent pas dépasser 2000 caractères';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Soumet la commande
   */
  submitOrder(): void {
    if (!this.validateForm() || !this.service) return;

    this.orderProcessing = true;
    this.formErrors.general = '';

    this.orderService.createOrder(
      this.service.id,
      this.orderForm.requirements,
      this.orderForm.attachments
    ).subscribe({
      next: (response: { message: string }) => {
        this.orderProcessing = false;
        this.successMessage = response.message || 'Commande créée avec succès !';

        // Fermer le modal après 2 secondes et rediriger
        setTimeout(() => {
          this.closeOrderModal();
          this.router.navigate(['/client/orders']);
        }, 2000);
      },
      error: (err: Error) => {
        this.orderProcessing = false;
        this.formErrors.general = err.message || 'Une erreur est survenue lors de la commande';
        console.error('Erreur lors de la commande:', err);
      }
    });
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  getAvatarUrl(avatar: string): string {
    if (!avatar) {
      console.log('No avatar provided');
      return '';
    }

    // Construire l'URL complète
    const fullUrl = `http://localhost:8000/storage/avatars/${avatar}`;
    console.log('Avatar URL constructed:', fullUrl);
    return fullUrl;
  }

  previousImage() {
    if (this.service?.images && this.service.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.service.images.length) % this.service.images.length;
    }
  }

  nextImage() {
    if (this.service?.images && this.service.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.service.images.length;
    }
  }

  selectImage(index: number) {
    this.currentImageIndex = index;
  }
}
