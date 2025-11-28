import {Component, OnInit} from '@angular/core';
import {Deliverable, Order} from "../../models/order";
import {ActivatedRoute, Router} from "@angular/router";
import {OrderService} from "../../services/order.service";

@Component({
  selector: 'app-client-order-detail',
  templateUrl: './client-order-detail.component.html',
  styleUrl: './client-order-detail.component.css'
})
export class ClientOrderDetailComponent implements OnInit {
  order: Order | null = null;
  isLoading = false;
  errorMessage = '';
  activeTab: 'details' | 'deliverables' = 'details';

  // Pour les modals
  showAcceptModal = false;
  showRevisionModal = false;
  showCancelModal = false;
  actionLoading = false;
  revisionNotes = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService
  ) {}

  ngOnInit(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.loadOrder(orderId);
    }
  }

  /**
   * Charger les détails de la commande
   */
  loadOrder(orderId: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.orderService.getOrderById(orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.errorMessage = error.error?.error || 'Impossible de charger la commande';
        this.isLoading = false;
      }
    });
  }

  /**
   * Changer d'onglet
   */
  switchTab(tab: 'details' | 'deliverables'): void {
    this.activeTab = tab;
  }

  /**
   * Ouvrir le modal d'acceptation de livraison
   */
  openAcceptModal(): void {
    this.showAcceptModal = true;
  }

  /**
   * Fermer le modal d'acceptation
   */
  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.actionLoading = false;
  }

  /**
   * Accepter la livraison
   */
  acceptDelivery(): void {
    if (!this.order) return;

    this.actionLoading = true;

    this.orderService.acceptDelivery(this.order.id).subscribe({
      next: (response) => {
        this. order = response. order;
        this.closeAcceptModal();
        this. actionLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors de l\'acceptation');
        this.actionLoading = false;
      }
    });
  }

  /**
   * Ouvrir le modal de demande de révision
   */
  openRevisionModal(): void {
    this.showRevisionModal = true;
    this.revisionNotes = '';
  }

  /**
   * Fermer le modal de révision
   */
  closeRevisionModal(): void {
    this.showRevisionModal = false;
    this.revisionNotes = '';
    this.actionLoading = false;
  }

  /**
   * Demander une révision
   */
  requestRevision(): void {
    if (! this.order) return;

    this.actionLoading = true;

    this.orderService.requestRevision(this.order.id, this.revisionNotes).subscribe({
      next: (response) => {
        this.order = response.order;
        this. closeRevisionModal();
        this.actionLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors de la demande de révision');
        this.actionLoading = false;
      }
    });
  }

  /**
   * Ouvrir le modal d'annulation
   */
  openCancelModal(): void {
    this.showCancelModal = true;
  }

  /**
   * Fermer le modal d'annulation
   */
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.actionLoading = false;
  }

  /**
   * Annuler la commande
   */
  cancelOrder(): void {
    if (!this.order) return;

    this.actionLoading = true;

    this.orderService.cancelOrder(this.order.id).subscribe({
      next: (response) => {
        this.order = response.order;
        this.closeCancelModal();
        this. actionLoading = false;
      },
      error: (error) => {
        console.error('Erreur:', error);
        alert(error.error?.error || 'Erreur lors de l\'annulation');
        this. actionLoading = false;
      }
    });
  }

  /**
   * Retour à la liste
   */
  goBack(): void {
    this. router.navigate(['/client/orders']);
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  /**
   * Obtenir la classe CSS du statut
   */
  getStatusClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status);
  }

  /**
   * Formater la date
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Vérifier si la commande est livrée
   */
  isDelivered(): boolean {
    return this.order?.status === 'delivered';
  }

  /**
   * Vérifier si la commande peut être annulée
   */
  canCancel(): boolean {
    return this.order?.status === 'pending';
  }

  /**
   * Vérifier si la commande a des livrables
   */
  hasDeliverables(): boolean {
    const orderWithDeliverables = this.order as (Order & { deliverables?: Deliverable[] }) | null;
    return (orderWithDeliverables?.deliverables?.length ??  0) > 0;
  }

  /**
   * Obtenir les livrables
   */
  getDeliverables(): Deliverable[] {
    const orderWithDeliverables = this.order as (Order & { deliverables?: Deliverable[] }) | null;
    return orderWithDeliverables?.deliverables ??  [];
  }

  /**
   * Télécharger un fichier
   */
  downloadFile(filePath: string): void {
    const url = `http://localhost:8000/storage/${filePath}`;
    window. open(url, '_blank');
  }

  /**
   * Obtenir l'icône du fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const iconMap: { [key: string]: string } = {
      pdf: 'fa-file-pdf text-red-600',
      doc: 'fa-file-word text-blue-600',
      docx: 'fa-file-word text-blue-600',
      xls: 'fa-file-excel text-green-600',
      xlsx: 'fa-file-excel text-green-600',
      ppt: 'fa-file-powerpoint text-orange-600',
      pptx: 'fa-file-powerpoint text-orange-600',
      jpg: 'fa-file-image text-purple-600',
      jpeg: 'fa-file-image text-purple-600',
      png: 'fa-file-image text-purple-600',
      zip: 'fa-file-archive text-yellow-600',
      rar: 'fa-file-archive text-yellow-600'
    };
    return iconMap[extension || ''] || 'fa-file text-gray-600';
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  formatAmount(amount: number): string {
    return new Intl. NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Vérifie si la commande a une image de service
   */
  hasServiceImage(order: Order): boolean {
    return ! !(order.service_offer?.service?. images && order.service_offer. service.images.length > 0);
  }

  /**
   * Récupère l'URL de la première image du service
   */
  getServiceImageUrl(order: Order): string {
    if (this.hasServiceImage(order)) {
      const imagePath = order.service_offer! .service! .images![0]. image_path;
      return this.getImageUrl(imagePath);
    }
    return 'https://via.placeholder.com/100x100? text=Service';
  }

  /**
   * Récupère le titre du service
   */
  getServiceTitle(order: Order): string {
    return order.service_offer?.service?. title || 'Service inconnu';
  }

  /**
   * Récupère le délai de livraison formaté
   */
  formatDeliveryDays(order: Order): string {
    const days = order.service_offer?.delivery_days ??  0;
    return `${days} jour${days > 1 ?  's' : ''}`;
  }

  /**
   * Récupère le nombre de révisions formaté
   */
  formatRevisions(order: Order): string {
    const revisions = order.service_offer?.number_of_revisions ?? 0;
    return `${revisions} révision${revisions > 1 ? 's' : ''}`;
  }

  /**
   * Récupère le nom du freelance
   */
  getFreelanceName(): string {
    return this.order?.service_offer?.service?.freelance?.user?.full_name || 'Freelance';
  }

  /**
   * Récupère l'email du freelance
   */
  getFreelanceEmail(): string {
    return this.order?. service_offer?.service?.freelance?.user?.email || 'N/A';
  }

  /**
   * Récupère les initiales du freelance
   */
  getFreelanceInitials(): string {
    const name = this.order?.service_offer?.service?.freelance?.user?.full_name;
    return name?. charAt(0). toUpperCase() || 'F';
  }
}
