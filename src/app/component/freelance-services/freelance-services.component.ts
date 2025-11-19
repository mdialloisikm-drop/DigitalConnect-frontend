import { Component, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subject, takeUntil } from 'rxjs';
import { Service } from '../../models/service';
import { Category } from '../../models/category';
import { ServiceImage } from '../../models/service_image';
import { FreelanceService } from '../../services/freelance.service';
import {environment} from "../../../environments/environment";

/**
 * Interface pour les erreurs de validation du formulaire
 */
interface FormErrors {
  title: string;
  description: string;
  price: string;
  delivery_time: string;
  categorie_id: string;
  number_of_revisions: string;
  images: string;
}

/**
 * Interface pour les fichiers image avec preview
 */
interface ImagePreview {
  file: File;
  url: string;
}

/**
 * Composant pour gérer les services du freelance
 */
@Component({
  selector: 'app-freelance-services',
  templateUrl: './freelance-services.component.html',
  styleUrl: './freelance-services.component.css'
})
export class FreelanceServicesComponent implements OnInit, OnDestroy {
  // État des données
  services: Service[] = [];
  filteredServices: Service[] = [];
  categories: Category[] = [];
  selectedService: Service | null = null;

  // Gestion des images
  selectedImages: ImagePreview[] = [];
  existingImages: ServiceImage[] = [];
  imagesToDelete: number[] = [];
  maxImages = 5;
  maxImageSize = 2 * 1024 * 1024; // 2MB
  allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];

  // État de l'interface
  isLoading = true;
  isCategoriesLoading = false;
  isSubmitting = false;
  isDeletingImage = false;
  errorMessage = '';
  searchTerm = '';
  showModal = false;
  showFormModal = false;
  isEditMode = false;

  // Données du formulaire
  formData = {
    title: '',
    description: '',
    price: 0,
    delivery_time: 1,
    categorie_id: 0,
    number_of_revisions: 1
  };

  // Erreurs de validation
  formErrors: FormErrors = {
    title: '',
    description: '',
    price: '',
    delivery_time: '',
    categorie_id: '',
    number_of_revisions: '',
    images: ''
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

  /**
   * Charge tous les services du freelance
   */
  loadServices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.freelanceService.getMyServices()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (services: Service[]) => {
          this.services = services;
          this.filteredServices = services;
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des services';
          console.error('Erreur lors du chargement des services:', error);
        }
      });
  }

  /**
   * Charge toutes les catégories depuis le backend
   */
  loadCategories(): void {
    this.isCategoriesLoading = true;

    this.freelanceService.getCategories()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCategoriesLoading = false)
      )
      .subscribe({
        next: (categories: Category[]) => {
          this.categories = categories;
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des catégories:', error);
          this.errorMessage = 'Erreur lors du chargement des catégories';
        }
      });
  }

  /**
   * Filtre les services selon le terme de recherche
   */
  filterServices(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredServices = this.services;
      return;
    }

    this.filteredServices = this.services.filter(service =>
      service.title.toLowerCase().includes(term) ||
      service.description.toLowerCase().includes(term) ||
      service.category?.name.toLowerCase().includes(term)
    );
  }

  /**
   * Gestion de la sélection d'images
   */
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const files = Array.from(input.files);
    this.formErrors.images = '';

    // Vérifier le nombre total d'images
    const totalImages = this.selectedImages.length + files.length +
      (this.isEditMode ? this.existingImages.length : 0);

    if (totalImages > this.maxImages) {
      this.formErrors.images = `Vous ne pouvez ajouter que ${this.maxImages} images maximum`;
      input.value = '';
      return;
    }

    // Valider et ajouter chaque fichier
    for (const file of files) {
      if (!this.validateImageFile(file)) {
        input.value = '';
        return;
      }

      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        if (e.target?.result) {
          this.selectedImages.push({
            file: file,
            url: e.target.result as string
          });
        }
      };
      reader.readAsDataURL(file);
    }

    // Réinitialiser l'input pour permettre de sélectionner à nouveau les mêmes fichiers
    input.value = '';
  }

  /**
   * Valide un fichier image
   */
  private validateImageFile(file: File): boolean {
    // Vérifier le type
    if (!this.allowedImageTypes.includes(file.type)) {
      this.formErrors.images = 'Format non autorisé. Utilisez: JPG, JPEG, PNG ou GIF';
      return false;
    }

    // Vérifier la taille
    if (file.size > this.maxImageSize) {
      this.formErrors.images = `L'image "${file.name}" dépasse 2MB`;
      return false;
    }

    return true;
  }

  /**
   * Retire une image de la sélection (avant envoi)
   */
  removeSelectedImage(index: number): void {
    URL.revokeObjectURL(this.selectedImages[index].url);
    this.selectedImages.splice(index, 1);
    this.formErrors.images = '';
  }

  /**
   * Marque une image existante pour suppression
   */
  markImageForDeletion(imageId: number): void {
    const index = this.existingImages.findIndex(img => img.id === imageId);
    if (index !== -1) {
      this.imagesToDelete.push(imageId);
      this.existingImages.splice(index, 1);
    }
  }

  /**
   * Supprime une image existante immédiatement
   */
  deleteExistingImage(imageId: number): void {
    if (!this.selectedService || !confirm('Voulez-vous vraiment supprimer cette image ?')) {
      return;
    }

    this.isDeletingImage = true;

    this.freelanceService.deleteServiceImage(this.selectedService.id, imageId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isDeletingImage = false)
      )
      .subscribe({
        next: (updatedService: Service) => {
          // Mettre à jour les images existantes
          this.existingImages = updatedService.images || [];
          this.showSuccessMessage('Image supprimée avec succès');
        },
        error: (error: Error) => {
          this.showErrorMessage(error.message || 'Erreur lors de la suppression de l\'image');
        }
      });
  }

  /**
   * Nettoie les URLs de preview
   */
  private cleanupImagePreviews(): void {
    this.selectedImages.forEach(img => URL.revokeObjectURL(img.url));
    this.selectedImages = [];
  }

  /**
   * Ouvre le modal de détails d'un service
   */
  openServiceDetails(service: Service): void {
    this.selectedService = service;
    this.showModal = true;
  }

  /**
   * Ferme le modal de détails
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedService = null;
  }

  /**
   * Ouvre le formulaire pour créer un nouveau service
   */
  openCreateForm(): void {
    this.isEditMode = false;
    this.resetForm();
    this.cleanupImagePreviews();
    this.existingImages = [];
    this.imagesToDelete = [];
    this.showFormModal = true;
  }

  /**
   * Ouvre le formulaire pour modifier un service
   */
  openEditForm(service: Service): void {
    this.isEditMode = true;
    this.formData = {
      title: service.title,
      description: service.description,
      price: service.price,
      delivery_time: service.delivery_time,
      categorie_id: service.categorie_id,
      number_of_revisions: service.number_of_revisions
    };
    this.selectedService = service;
    this.existingImages = service.images ? [...service.images] : [];
    this.cleanupImagePreviews();
    this.imagesToDelete = [];
    this.showFormModal = true;
    this.resetValidationErrors();
  }

  /**
   * Ferme le formulaire
   */
  closeFormModal(): void {
    this.showFormModal = false;
    this.selectedService = null;
    this.resetForm();
    this.cleanupImagePreviews();
    this.existingImages = [];
    this.imagesToDelete = [];
  }

  /**
   * Soumet le formulaire (création ou modification)
   */
  submitForm(): void {
    if (!this.validateForm()) {
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

  /**
   * Crée un nouveau service
   */
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

  /**
   * Met à jour un service existant
   */
  private updateService(id: number, formData: FormData): void {
    this.freelanceService.updateService(id, formData)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isSubmitting = false)
      )
      .subscribe({
        next: (updatedService: Service) => {
          // Si des nouvelles images ont été ajoutées, les envoyer séparément
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

  /**
   * Ajoute des images à un service existant
   */
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

  /**
   * Supprime un service après confirmation
   */
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

  /**
   * Construit le FormData pour l'envoi au backend
   */
  private buildFormData(): FormData {
    const formData = new FormData();
    formData.append('title', this.formData.title.trim());
    formData.append('description', this.formData.description.trim());
    formData.append('price', this.formData.price.toString());
    formData.append('delivery_time', this.formData.delivery_time.toString());
    formData.append('categorie_id', this.formData.categorie_id.toString());

    // Ajouter les images uniquement lors de la création
    if (!this.isEditMode) {
      this.selectedImages.forEach((img) => {
        formData.append('images[]', img.file, img.file.name);
      });
    }

    return formData;
  }

  /**
   * Valide les données du formulaire
   */
  private validateForm(): boolean {
    this.resetValidationErrors();
    let isValid = true;

    // Validation du titre
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

    // Validation de la description
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

    // Validation du prix
    if (this.formData.price <= 0) {
      this.formErrors.price = 'Le prix doit être supérieur à 0';
      isValid = false;
    } else if (this.formData.price > 1000000) {
      this.formErrors.price = 'Le prix ne doit pas dépasser 1 000 000 FCFA';
      isValid = false;
    }

    // Validation du délai de livraison
    if (this.formData.delivery_time <= 0) {
      this.formErrors.delivery_time = 'Le délai de livraison doit être supérieur à 0';
      isValid = false;
    } else if (this.formData.delivery_time > 365) {
      this.formErrors.delivery_time = 'Le délai ne doit pas dépasser 365 jours';
      isValid = false;
    }

    // Validation de la catégorie
    if (this.formData.categorie_id <= 0) {
      this.formErrors.categorie_id = 'Veuillez sélectionner une catégorie';
      isValid = false;
    }

    if (this.formData.number_of_revisions <= 0) {
      this.formErrors.number_of_revisions = 'Le nombre de révisions doit être supérieur à 0';
      isValid = false;
    } else if (this.formData.number_of_revisions > 10) {
      this.formErrors.number_of_revisions = 'Le nombre de révisions ne doit pas dépasser 10';
      isValid = false;
    }

    // Validation des images (uniquement pour la création)
    if (!this.isEditMode && this.selectedImages.length === 0) {
      this.formErrors.images = 'Au moins une image est requise';
      isValid = false;
    }

    return isValid;
  }

  /**
   * Réinitialise les erreurs de validation
   */
  private resetValidationErrors(): void {
    this.formErrors = {
      title: '',
      description: '',
      price: '',
      delivery_time: '',
      categorie_id: '',
      number_of_revisions: '',
      images: ''
    };
  }

  /**
   * Réinitialise le formulaire
   */
  private resetForm(): void {
    this.formData = {
      title: '',
      description: '',
      price: 0,
      delivery_time: 1,
      categorie_id: 0,
      number_of_revisions: 1
    };
    this.resetValidationErrors();
  }

  /**
   * Retourne l'URL de la première image du service
   */
  getServiceImage(service: Service): string {
    if (service.images && service.images.length > 0) {
      return this.getImageUrl(service.images[0].image_path);
    }
    return 'https://via.placeholder.com/400x300?text=Service';
  }

  /**
   * Retourne l'URL complète d'une image
   */
  getImageUrl(imagePath: string): string {
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    return `${environment.apiUrl.replace('/api', '')}/storage/${imagePath}`;
  }

  /**
   * Retourne le badge de statut avec les bonnes couleurs
   */
  getStatusBadge(status: string): { class: string; label: string } {
    return status === 'published'
      ? { class: 'bg-green-100 text-green-800', label: 'Publié' }
      : { class: 'bg-gray-100 text-gray-800', label: 'Archivé' };
  }

  /**
   * Affiche un message de succès
   */
  private showSuccessMessage(message: string): void {
    alert(message);
  }

  /**
   * Affiche un message d'erreur
   */
  private showErrorMessage(message: string): void {
    alert(`Erreur: ${message}`);
  }

  /**
   * Retourne le nombre total d'images
   */
  getTotalImages(): number {
    return this.selectedImages.length + this.existingImages.length;
  }

  /**
   * Vérifie si on peut ajouter plus d'images
   */
  canAddMoreImages(): boolean {
    return this.getTotalImages() < this.maxImages;
  }

  /**
   * Vérifie si le formulaire est valide pour activer/désactiver le bouton submit
   */
  isFormValid(): boolean {
    const basicValidation = this.formData.title.trim().length >= 10 &&
      this.formData.description.trim().length >= 50 &&
      this.formData.price > 0 &&
      this.formData.delivery_time > 0 &&
      this.formData.categorie_id > 0;

    if (this.isEditMode) {
      return basicValidation;
    }

    return basicValidation && this.selectedImages.length > 0;
  }
}
