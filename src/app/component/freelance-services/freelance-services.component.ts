import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { FreelanceService } from '../../services/freelance.service';
import { Service } from '../../models/service';
import { Category } from '../../models/category';
import { ServiceImage } from '../../models/service_image';

interface ImagePreview {
  file: File;
  url: string;
}

interface FormErrors {
  title: string;
  description: string;
  categorie_id: string;
  images: string;
  offers: string;
}

interface OfferFormData {
  title: 'Starter' | 'Standard' | 'Advanced';
  delivery_days: number;
  number_of_revisions: number;
  price: number;
}

@Component({
  selector: 'app-freelance-services',
  templateUrl: './freelance-services.component.html',
  styleUrls: ['./freelance-services.component.css']  // ✅ styleUrls avec un 's'
})
export class FreelanceServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  filteredServices: Service[] = [];
  categories: Category[] = [];
  selectedService: Service | null = null;

  isLoading = true;
  isCategoriesLoading = false;
  isSubmitting = false;
  isDeletingImage = false;
  errorMessage = '';
  searchTerm = '';
  showModal = false;
  showFormModal = false;
  isEditMode = false;

  // Stepper
  currentStep = 1;
  totalSteps = 3;

  // Toggle 3 offres
  enableThreeOffers = false;

  // Données du formulaire - Étape 1 : Informations
  formData = {
    title: '',
    description: '',
    categorie_id: 0
  };

  // Données du formulaire - Étape 3 : Offres
  offers: OfferFormData[] = [
    { title: 'Starter', delivery_days: 7, number_of_revisions: 1, price: 0 }
  ];

  // Gestion des images
  selectedImages: ImagePreview[] = [];
  existingImages: ServiceImage[] = [];
  imagesToDelete: number[] = [];
  maxImages = 5;

  // Erreurs de validation
  formErrors: FormErrors = {
    title: '',
    description: '',
    categorie_id: '',
    images: '',
    offers: ''
  };

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly freelanceService: FreelanceService) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupImagePreviews();
  }

  // ==================== CHARGEMENT DES DONNÉES ====================

  loadServices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.freelanceService.getMyServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services: Service[]) => {
          this.services = services;
          this.filteredServices = services;
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des services';
          this.isLoading = false;
        }
      });
  }

  loadCategories(): void {
    this.isCategoriesLoading = true;

    this.freelanceService.getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (categories: Category[]) => {
          this.categories = categories;
          this.isCategoriesLoading = false;
        },
        error: () => {
          this.isCategoriesLoading = false;
        }
      });
  }

  filterServices(): void {
    if (!this.searchTerm.trim()) {
      this.filteredServices = this.services;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredServices = this.services.filter(service =>
      service.title.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term)
    );
  }

  // ==================== STEPPER ====================

  goToStep(step: number): void {
    if (step < 1 || step > this.totalSteps) return;

    if (step > this.currentStep) {
      if (!this.validateCurrentStep()) return;
    }

    this.currentStep = step;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      if (this.validateCurrentStep()) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Retourne les classes CSS pour un step du stepper
   */
  getStepClass(step: number): string {
    if (this.currentStep === step || this.isStepCompleted(step)) {
      return 'bg-primary text-white';
    }
    return 'bg-gray-200 text-gray-500';
  }

  isStepCompleted(step: number): boolean {
    switch (step) {
      case 1:
        return this.formData.title.trim().length >= 10 &&
          this.formData.description.trim().length >= 50 &&
          this.formData.categorie_id > 0;
      case 2:
        return this.isEditMode ? true : this.selectedImages.length > 0 || this.existingImages.length > 0;
      case 3:
        return this.validateOffers();
      default:
        return false;
    }
  }

  isStepAccessible(step: number): boolean {
    if (step === 1) return true;
    for (let i = 1; i < step; i++) {
      if (!this.isStepCompleted(i)) return false;
    }
    return true;
  }

  validateCurrentStep(): boolean {
    this.resetValidationErrors();

    switch (this.currentStep) {
      case 1:
        return this.validateStep1();
      case 2:
        return this.validateStep2();
      case 3:
        return this.validateStep3();
      default:
        return true;
    }
  }

  validateStep1(): boolean {
    let isValid = true;

    if (!this.formData.title.trim()) {
      this.formErrors.title = 'Le titre est requis';
      isValid = false;
    } else if (this.formData.title.trim().length < 10) {
      this.formErrors.title = 'Le titre doit contenir au moins 10 caractères';
      isValid = false;
    } else if (this.formData.title.trim().length > 255) {
      this.formErrors.title = 'Le titre ne doit pas dépasser 255 caractères';
      isValid = false;
    }

    if (!this.formData.description.trim()) {
      this.formErrors.description = 'La description est requise';
      isValid = false;
    } else if (this.formData.description.trim().length < 50) {
      this.formErrors.description = 'La description doit contenir au moins 50 caractères';
      isValid = false;
    } else if (this.formData.description.trim().length > 5000) {
      this.formErrors.description = 'La description ne doit pas dépasser 5000 caractères';
      isValid = false;
    }

    if (this.formData.categorie_id <= 0) {
      this.formErrors.categorie_id = 'Veuillez sélectionner une catégorie';
      isValid = false;
    }

    return isValid;
  }

  validateStep2(): boolean {
    if (!this.isEditMode && this.selectedImages.length === 0 && this.existingImages.length === 0) {
      this.formErrors.images = 'Au moins une image est requise';
      return false;
    }
    return true;
  }

  validateStep3(): boolean {
    return this.validateOffers();
  }

  validateOffers(): boolean {
    for (const offer of this.offers) {
      if (offer.price <= 0) return false;
      if (offer.delivery_days <= 0) return false;
      if (offer.number_of_revisions < 0) return false;
    }
    return true;
  }

  // ==================== GESTION DES OFFRES ====================

  toggleThreeOffers(): void {
    this.enableThreeOffers = !this.enableThreeOffers;

    if (this.enableThreeOffers) {
      if (this.offers.length === 1) {
        const starterOffer = this.offers[0];
        this.offers = [
          starterOffer,
          {
            title: 'Standard',
            delivery_days: Math.max(1, starterOffer.delivery_days - 2),
            number_of_revisions: starterOffer.number_of_revisions + 1,
            price: Math.round(starterOffer.price * 1.5)
          },
          {
            title: 'Advanced',
            delivery_days: Math.max(1, starterOffer.delivery_days - 4),
            number_of_revisions: starterOffer.number_of_revisions + 2,
            price: Math.round(starterOffer.price * 2)
          }
        ];
      }
    } else {
      this.offers = [this.offers[0]];
      this.offers[0].title = 'Starter';
    }
  }

  getOfferByTitle(title: 'Starter' | 'Standard' | 'Advanced'): OfferFormData {
    return this.offers.find(o => o.title === title) || this.offers[0];
  }

  // ==================== GESTION DES IMAGES ====================

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const remainingSlots = this.maxImages - this.getTotalImages();

    files.slice(0, remainingSlots).forEach(file => {
      if (this.validateImage(file)) {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          this.selectedImages.push({
            file,
            url: e.target?.result as string
          });
        };
        reader.readAsDataURL(file);
      }
    });

    input.value = '';
  }

  validateImage(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      this.formErrors.images = 'Format non supporté. Utilisez JPG, PNG ou GIF.';
      return false;
    }

    if (file.size > maxSize) {
      this.formErrors.images = 'L\'image ne doit pas dépasser 2MB.';
      return false;
    }

    return true;
  }

  removeSelectedImage(index: number): void {
    URL.revokeObjectURL(this.selectedImages[index].url);
    this.selectedImages.splice(index, 1);
  }

  deleteExistingImage(imageId: number): void {
    if (!this.selectedService) return;

    this.isDeletingImage = true;

    this.freelanceService.deleteServiceImage(this.selectedService.id, imageId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDeletingImage = false)
      )
      .subscribe({
        next: () => {
          this.existingImages = this.existingImages.filter(img => img.id !== imageId);
          this.showSuccessMessage('Image supprimée');
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de la suppression');
        }
      });
  }

  getTotalImages(): number {
    return this.existingImages.length + this.selectedImages.length;
  }

  canAddMoreImages(): boolean {
    return this.getTotalImages() < this.maxImages;
  }

  cleanupImagePreviews(): void {
    this.selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    this.selectedImages = [];
  }

  // ==================== MODALS ====================

  openServiceDetails(service: Service): void {
    this.selectedService = service;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedService = null;
  }

  openCreateForm(): void {
    this.isEditMode = false;
    this.resetForm();
    this.cleanupImagePreviews();
    this.existingImages = [];
    this.imagesToDelete = [];
    this.currentStep = 1;
    this.enableThreeOffers = false;
    this.offers = [{ title: 'Starter', delivery_days: 7, number_of_revisions: 1, price: 0 }];
    this.showFormModal = true;
  }

  openEditForm(service: Service): void {
    this.isEditMode = true;
    this.selectedService = service;

    this.formData = {
      title: service.title,
      description: service.description,
      categorie_id: service.categorie_id
    };

    if (service.offers && service.offers.length > 0) {
      this.offers = service.offers.map(offer => ({
        title: offer.title,
        delivery_days: offer.delivery_days,
        number_of_revisions: offer.number_of_revisions,
        price: offer.price
      }));
      this.enableThreeOffers = service.offers.length === 3;
    } else {
      this.offers = [{ title: 'Starter', delivery_days: 7, number_of_revisions: 1, price: 0 }];
      this.enableThreeOffers = false;
    }

    this.existingImages = service.images ? [...service.images] : [];
    this.cleanupImagePreviews();
    this.imagesToDelete = [];
    this.currentStep = 1;
    this.showFormModal = true;
    this.resetValidationErrors();
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedService = null;
    this.resetForm();
    this.cleanupImagePreviews();
    this.existingImages = [];
    this.imagesToDelete = [];
    this.currentStep = 1;
  }

  // ==================== SOUMISSION ====================

  submitForm(): void {
    if (!this.validateAllSteps()) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.buildFormData();

    if (this.isEditMode && this.selectedService) {
      this.updateService(this.selectedService.id, formData);
    } else {
      this.createService(formData);
    }
  }

  validateAllSteps(): boolean {
    for (let step = 1; step <= this.totalSteps; step++) {
      this.currentStep = step;
      if (!this.validateCurrentStep()) {
        return false;
      }
    }
    return true;
  }

  private createService(formData: FormData): void {
    this.freelanceService.createService(formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: () => {
          this.closeFormModal();
          this.loadServices();
          this.showSuccessMessage('Service créé avec succès');
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de la création du service');
        }
      });
  }

  private updateService(id: number, formData: FormData): void {
    this.freelanceService.updateService(id, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (updatedService: Service) => {
          if (this.selectedImages.length > 0) {
            this.addImagesToService(updatedService.id);
          } else {
            this.closeFormModal();
            this.loadServices();
            this.showSuccessMessage('Service modifié avec succès');
          }
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de la modification du service');
        }
      });
  }

  private addImagesToService(serviceId: number): void {
    const imagesFormData = new FormData();
    this.selectedImages.forEach((img, index) => {
      imagesFormData.append(`images[${index}]`, img.file);
    });

    this.freelanceService.addServiceImages(serviceId, imagesFormData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.closeFormModal();
          this.loadServices();
          this.showSuccessMessage('Service modifié avec succès');
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de l\'ajout des images');
        }
      });
  }

  deleteService(service: Service): void {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le service "${service.title}" ?`)) {
      return;
    }

    this.freelanceService.deleteService(service.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadServices();
          this.closeModal();
          this.showSuccessMessage('Service supprimé avec succès');
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de la suppression du service');
        }
      });
  }

  private buildFormData(): FormData {
    const formData = new FormData();
    formData.append('title', this.formData.title.trim());
    formData.append('description', this.formData.description.trim());
    formData.append('categorie_id', this.formData.categorie_id.toString());

    this.offers.forEach((offer, index) => {
      formData.append(`offers[${index}][title]`, offer.title);
      formData.append(`offers[${index}][delivery_days]`, offer.delivery_days.toString());
      formData.append(`offers[${index}][number_of_revisions]`, offer.number_of_revisions.toString());
      formData.append(`offers[${index}][price]`, offer.price.toString());
    });

    if (!this.isEditMode) {
      this.selectedImages.forEach((img) => {
        formData.append('images[]', img.file, img.file.name);
      });
    }

    return formData;
  }

  // ==================== UTILITAIRES ====================

  getServiceImage(service: Service): string {
    if (service.images && service.images.length > 0) {
      return this.getImageUrl(service.images[0].image_path);
    }
    return 'https://via.placeholder.com/400x300?text=Service';
  }

  getImageUrl(path: string): string {
    if (path.startsWith('http')) {
      return path;
    }
    return `http://localhost:8000/storage/${path}`;
  }

  getStatusBadge(status: string): { class: string; label: string } {
    const badges: { [key: string]: { class: string; label: string } } = {
      'published': { class: 'bg-green-100 text-green-800', label: 'Publié' },
      'en_attente': { class: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      'archived': { class: 'bg-gray-100 text-gray-800', label: 'Archivé' },
      'rejected': { class: 'bg-red-100 text-red-800', label: 'Rejeté' }
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status };
  }

  getMinPrice(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math.min(...service.offers.map(o => o.price));
    }
    return service.price || 0;
  }

  private resetValidationErrors(): void {
    this.formErrors = {
      title: '',
      description: '',
      categorie_id: '',
      images: '',
      offers: ''
    };
  }

  private resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      categorie_id: 0
    };
    this.offers = [{ title: 'Starter', delivery_days: 7, number_of_revisions: 1, price: 0 }];
    this.enableThreeOffers = false;
    this.resetValidationErrors();
  }

  isFormValid(): boolean {
    return this.isStepCompleted(1) && this.isStepCompleted(2) && this.isStepCompleted(3);
  }

  private showSuccessMessage(message: string): void {
    alert(message);
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }
}
