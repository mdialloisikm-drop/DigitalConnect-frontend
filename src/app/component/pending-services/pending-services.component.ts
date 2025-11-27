import {Component, OnDestroy, OnInit} from '@angular/core';
import {Service} from "../../models/service";
import {finalize, Subject, takeUntil} from "rxjs";
import {Router} from "@angular/router";
import {AdminModerationService} from "../../services/admin-moderation.service";

@Component({
  selector: 'app-pending-services',
  templateUrl: './pending-services.component.html',
  styleUrl: './pending-services.component.css'
})
export class PendingServicesComponent implements OnInit, OnDestroy {
  services: Service[] = [];
  loading = false;
  error = false;
  errorMessage = '';

  // Pour le carrousel d'images
  currentImageIndex: { [key: number]: number } = {};

  // Pour la modal de détails
  showDetailModal = false;
  selectedService: Service | null = null;

  // Pour la modal de rejet
  showRejectModal = false;
  serviceToReject: Service | null = null;
  rejectReason = '';
  rejectLoading = false;

  // Pour la modal de confirmation d'approbation
  showApproveModal = false;
  serviceToApprove: Service | null = null;
  approveLoading = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly moderationService: AdminModerationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingServices();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les services en attente
   */
  loadPendingServices(): void {
    this.loading = true;
    this.error = false;

    this.moderationService.getPendingServices()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (services) => {
          this.services = services;
          // Initialiser l'index des images pour chaque service
          this.services.forEach(service => {
            this.currentImageIndex[service.id] = 0;
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des services:', error);
          this.error = true;
          this.errorMessage = 'Impossible de charger les services en attente';
          this.loading = false;
        }
      });
  }

  // ==================== CARROUSEL D'IMAGES ====================

  /**
   * Passer à l'image suivante
   */
  nextImage(serviceId: number, totalImages: number, event: Event): void {
    event.stopPropagation();
    if (this.currentImageIndex[serviceId] < totalImages - 1) {
      this.currentImageIndex[serviceId]++;
    } else {
      this.currentImageIndex[serviceId] = 0;
    }
  }

  /**
   * Passer à l'image précédente
   */
  prevImage(serviceId: number, totalImages: number, event: Event): void {
    event.stopPropagation();
    if (this.currentImageIndex[serviceId] > 0) {
      this.currentImageIndex[serviceId]--;
    } else {
      this. currentImageIndex[serviceId] = totalImages - 1;
    }
  }

  /**
   * Aller à une image spécifique
   */
  goToImage(serviceId: number, index: number, event: Event): void {
    event.stopPropagation();
    this.currentImageIndex[serviceId] = index;
  }

  /**
   * Obtenir l'index actuel de l'image
   */
  getCurrentImageIndex(serviceId: number): number {
    return this. currentImageIndex[serviceId] || 0;
  }

  // ==================== UTILITAIRES ====================

  /**
   * Obtenir l'URL d'une image
   */
  getImageUrl(path: string): string {
    if (!path) return 'https://via.placeholder.com/400x300? text=Service';
    if (path.startsWith('http')) return path;
    return `http://localhost:8000/storage/${path}`;
  }

  /**
   * Obtenir l'image principale du service
   */
  getServiceImage(service: Service, index?: number): string {
    const imageIndex = index !== undefined ? index : this.getCurrentImageIndex(service.id);
    if (service.images && service.images.length > 0 && service.images[imageIndex]) {
      return this.getImageUrl(service.images[imageIndex]. image_path);
    }
    return 'https://via.placeholder.com/400x300?text=Service';
  }

  /**
   * Obtenir l'avatar du freelance
   */
  getAvatarUrl(avatar: string | undefined, userName?: string): string {
    if (avatar && (avatar.startsWith('http://') || avatar.startsWith('https://'))) {
      return avatar;
    }
    if (avatar) {
      return `http://localhost:8000/storage/avatars/${avatar}`;
    }
    const name = userName || 'User';
    return `https://ui-avatars.com/api/? name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  /**
   * Tronquer la description
   */
  truncateDescription(description: string, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description. substring(0, maxLength) + '...';
  }

  /**
   * Obtenir le prix minimum du service (depuis les offres)
   */
  getMinPrice(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math.min(...service.offers.map(o => o.price));
    }
    return 0;
  }

  /**
   * Obtenir le prix maximum du service
   */
  getMaxPrice(service: Service): number {
    if (service.offers && service. offers.length > 0) {
      return Math.max(...service.offers.map(o => o.price));
    }
    return 0;
  }

  /**
   * Obtenir le délai minimum de livraison
   */
  getMinDeliveryDays(service: Service): number {
    if (service.offers && service.offers.length > 0) {
      return Math.min(... service.offers.map(o => o.delivery_days));
    }
    return 0;
  }

  /**
   * Formater le prix
   */
  formatPrice(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Obtenir le badge de l'offre
   */
  getOfferBadgeClass(title: string): string {
    switch (title) {
      case 'Starter':
        return 'bg-gray-100 text-gray-700';
      case 'Standard':
        return 'bg-blue-100 text-blue-700';
      case 'Advanced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // ==================== MODAL DE DÉTAILS ====================

  /**
   * Ouvrir la modal de détails
   */
  openDetailModal(service: Service): void {
    this.selectedService = service;
    this.showDetailModal = true;
  }

  /**
   * Fermer la modal de détails
   */
  closeDetailModal(): void {
    this.selectedService = null;
    this.showDetailModal = false;
  }

  // ==================== APPROBATION ====================

  /**
   * Ouvrir la modal d'approbation
   */
  openApproveModal(service: Service, event?: Event): void {
    if (event) event.stopPropagation();
    this.serviceToApprove = service;
    this.showApproveModal = true;
  }

  /**
   * Fermer la modal d'approbation
   */
  closeApproveModal(): void {
    this.serviceToApprove = null;
    this.showApproveModal = false;
  }

  /**
   * Confirmer l'approbation
   */
  confirmApprove(): void {
    if (! this.serviceToApprove) return;

    this.approveLoading = true;

    this.moderationService.approveService(this.serviceToApprove.id)
      . pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== this.serviceToApprove?. id);
          this.approveLoading = false;
          this.closeApproveModal();
          this.closeDetailModal();
          this.showSuccessMessage('Service approuvé avec succès');
        },
        error: (error) => {
          console. error('Erreur lors de l\'approbation:', error);
          this.approveLoading = false;
          this.showErrorMessage('Erreur lors de l\'approbation du service');
        }
      });
  }

  // ==================== REJET ====================

  /**
   * Ouvrir la modal de rejet
   */
  openRejectModal(service: Service, event?: Event): void {
    if (event) event.stopPropagation();
    this.serviceToReject = service;
    this. rejectReason = '';
    this.showRejectModal = true;
  }

  /**
   * Fermer la modal de rejet
   */
  closeRejectModal(): void {
    this.serviceToReject = null;
    this.rejectReason = '';
    this.showRejectModal = false;
  }

  /**
   * Confirmer le rejet
   */
  confirmReject(): void {
    if (!this. serviceToReject) return;

    this.rejectLoading = true;

    this.moderationService.rejectService(this. serviceToReject.id, this.rejectReason)
      .pipe(takeUntil(this.destroy$))
      . subscribe({
        next: () => {
          this.services = this.services.filter(s => s.id !== this.serviceToReject?.id);
          this. rejectLoading = false;
          this.closeRejectModal();
          this.closeDetailModal();
          this.showSuccessMessage('Service rejeté avec succès');
        },
        error: (error) => {
          console.error('Erreur lors du rejet:', error);
          this.rejectLoading = false;
          this.showErrorMessage('Erreur lors du rejet du service');
        }
      });
  }

  // ==================== MESSAGES ====================

  private showSuccessMessage(message: string): void {
    // Tu peux utiliser un toast/notification ici
    alert(message);
  }

  private showErrorMessage(message: string): void {
    alert(message);
  }
}
