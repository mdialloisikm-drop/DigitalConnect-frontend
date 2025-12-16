import {Component, OnDestroy, OnInit} from '@angular/core';
import {Service} from "../../models/service";
import {ActivatedRoute, Router} from "@angular/router";
import {ApiService} from "../../services/api.service";
import {AuthService} from "../../services/auth.service";
import {OrderService} from "../../services/order.service";
import {ServiceOffer} from "../../models/service-offer";
import {interval, Subscription} from "rxjs";

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
export class ServiceDetailComponent implements OnInit, OnDestroy {
  service?: Service;
  loading = true;
  error = false;
  currentImageIndex = 0;

  // Offre sélectionnée
  selectedOffer?: ServiceOffer;

  // Carrousel automatique
  private carouselSubscription?: Subscription;
  private readonly carouselInterval = 5000;

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

  // Messages
  successMessage = '';
  errorMessage = '';

  // Informations sur les fichiers
  readonly maxFiles = 5;
  readonly maxFileSize = 10 * 1024 * 1024;
  readonly allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/zip',
    'application/x-rar-compressed'
  ];

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

  ngOnDestroy() {
    this.stopCarousel();
  }

  loadService(id: number) {
    this.loading = true;
    this.apiService.getService(id).subscribe({
      next: (service) => {
        this.service = service;
        this.loading = false;

        // Sélectionner la première offre par défaut
        if (service. offers && service.offers.length > 0) {
          this. selectedOffer = service.offers[0];
        }

        // Démarrer le carrousel si plusieurs images
        if (service.images && service.images.length > 1) {
          this.startCarousel();
        }
      },
      error: (error) => {
        console.error('Error loading service:', error);
        this.error = true;
        this.loading = false;
      }
    });
  }

  // ==================== CARROUSEL ====================

  private startCarousel(): void {
    this.stopCarousel();
    this.carouselSubscription = interval(this.carouselInterval). subscribe(() => {
      this. nextImage();
    });
  }

  private stopCarousel(): void {
    if (this.carouselSubscription) {
      this.carouselSubscription. unsubscribe();
      this.carouselSubscription = undefined;
    }
  }

  private resetCarouselTimer(): void {
    if (this.service?.images && this.service.images.length > 1) {
      this.startCarousel();
    }
  }

  previousImage(): void {
    if (this. service?.images && this.service.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex - 1 + this.service.images.length) % this. service.images.length;
      this.resetCarouselTimer();
    }
  }

  nextImage(): void {
    if (this.service?.images && this.service.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this. service.images.length;
    }
  }

  selectImage(index: number): void {
    this.currentImageIndex = index;
    this.resetCarouselTimer();
  }

  // ==================== OFFRES ====================

  selectOffer(offer: ServiceOffer): void {
    this.selectedOffer = offer;
  }

  // ==================== COMMANDE ====================

  openOrderModal(): void {
    if (! this.authService.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }

    if (this.authService.currentUserValue?. user_type !== 'client') {
      this.errorMessage = 'Seuls les clients peuvent commander des services';
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    if (! this.selectedOffer) {
      this. errorMessage = 'Veuillez sélectionner une offre';
      setTimeout(() => this. errorMessage = '', 5000);
      return;
    }

    this.showOrderModal = true;
    this.resetOrderForm();
    this.stopCarousel();
  }

  closeOrderModal(): void {
    this. showOrderModal = false;
    this.resetOrderForm();
    if (this.service?. images && this.service.images. length > 1) {
      this.startCarousel();
    }
  }

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
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (! input.files) return;

    const files = Array.from(input.files);
    this.formErrors.attachments = '';

    if (this.orderForm.attachments.length + files.length > this.maxFiles) {
      this.formErrors.attachments = `Vous ne pouvez joindre que ${this.maxFiles} fichiers maximum`;
      return;
    }

    for (const file of files) {
      if (!this.allowedTypes.includes(file.type)) {
        this.formErrors.attachments = `Le fichier ${file.name} n'est pas un format autorisé`;
        return;
      }

      if (file. size > this.maxFileSize) {
        this.formErrors. attachments = `Le fichier ${file.name} dépasse la taille maximale de 10 Mo`;
        return;
      }

      this.orderForm.attachments.push(file);
    }

    input.value = '';
  }

  removeFile(index: number): void {
    this.orderForm.attachments.splice(index, 1);
    this.formErrors.attachments = '';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math. pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileIcon(file: File): string {
    if (file.type. startsWith('image/')) return 'fa-file-image';
    if (file.type.includes('pdf')) return 'fa-file-pdf';
    if (file.type.includes('word') || file.type.includes('document')) return 'fa-file-word';
    if (file. type.includes('zip') || file.type.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
  }

  private validateForm(): boolean {
    this.formErrors = {
      requirements: '',
      attachments: '',
      general: ''
    };

    let isValid = true;

    if (this.orderForm.requirements && this.orderForm.requirements.length > 2000) {
      this.formErrors.requirements = 'Les exigences ne doivent pas dépasser 2000 caractères';
      isValid = false;
    }

    return isValid;
  }

  submitOrder(): void {
    if (! this.validateForm() || ! this.service || !this.selectedOffer) return;

    this.orderProcessing = true;
    this.formErrors.general = '';

    this.orderService.createOrder(
      this.selectedOffer.id! ,
      this.orderForm. requirements,
      this.orderForm.attachments
    ).subscribe({
      next: (response: { message: string }) => {
        this.orderProcessing = false;
        this.successMessage = response.message || 'Commande créée avec succès! ';

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

  // ==================== UTILITAIRES ====================

  getImageUrl(image: any): string {
    if (!image) return '';
    // Utiliser image_url retourné par le backend (URL S3)
    if (typeof image === 'object' && image.image_url) {
      return image.image_url;
    }
    // Fallback pour string (ancien format)
    if (typeof image === 'string') {
      if (image.startsWith('http')) return image;
    }
    return '';
  }

  getAvatarUrl(user: any): string {
    if (!user) return '';
    // Utiliser avatar_url retourné par le backend (URL S3)
    if (user.avatar_url) {
      return user.avatar_url;
    }
    // Fallback
    if (user.avatar && user.avatar.startsWith('http')) {
      return user. avatar;
    }
    return '';
  }

  getFirstLetter(name?: string): string {
    return name?. charAt(0) || '?';
  }

  getMinPrice(service: Service): number {
    if (service.offers && service.offers. length > 0) {
      return Math.min(...service.offers.map(o => o.price));
    }
    return 0;
  }

  getMinDeliveryDays(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math.min(...service.offers. map(o => o.delivery_days));
    }
    return 0;
  }
}
