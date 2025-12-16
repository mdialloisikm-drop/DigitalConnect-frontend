import {Component, OnDestroy, OnInit} from '@angular/core';
import {Order} from "../../models/order";
import {Subject, takeUntil} from "rxjs";
import {OrderService} from "../../services/order.service";
import {Router} from "@angular/router";
import {Service} from "../../models/service";

@Component({
  selector: 'app-client-orders',
  templateUrl: './client-orders.component.html',
  styleUrl: './client-orders.component.css'
})
export class ClientOrdersComponent implements OnInit, OnDestroy {
  // Liste des commandes
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  // États de l'interface
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';

  // Modal de confirmation d'annulation
  showCancelModal: boolean = false;
  orderToCancel: Order | null = null;
  actionLoading: boolean = false;

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    in_progress: 0,
    delivered: 0,
    completed: 0
  };

  // Subject pour la désinscription
  private destroy$ = new Subject<void>();

  constructor(
    public orderService: OrderService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$. next();
    this.destroy$. complete();
  }

  /**
   * Charge toutes les commandes du client
   */
  loadOrders(forceRefresh: boolean = false): void {
    this.loading = true;
    this.error = '';

    this.orderService.getMyOrders(forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (orders: Order[]) => {
          this.orders = orders;
          this.applyFilters();
          this. calculateStats();
          this.loading = false;
        },
        error: (error: Error) => {
          this.error = error.message;
          this.loading = false;
        }
      });
  }

  /**
   * Applique les filtres
   */
  applyFilters(): void {
    let filtered = [... this.orders];

    // Filtre par statut
    filtered = this.orderService.filterByStatus(filtered, this.selectedFilter);

    // Trie par date (plus récentes en premier)
    this.filteredOrders = this.orderService.sortByDate(filtered);
  }

  /**
   * Change le filtre de statut
   */
  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  /**
   * Calcule les statistiques
   */
  calculateStats(): void {
    this.stats = this.orderService.getOrderStats(this.orders);
  }

  /**
   * Ouvre le modal de confirmation d'annulation
   */
  openCancelModal(event: Event, order: Order): void {
    event.stopPropagation();
    if (! this.canCancelOrder(order)) {
      this.error = 'Cette commande ne peut pas être annulée';
      return;
    }
    this.orderToCancel = order;
    this.showCancelModal = true;
  }

  /**
   * Ferme le modal d'annulation
   */
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.orderToCancel = null;
    this.actionLoading = false;
  }

  /**
   * Confirme l'annulation d'une commande
   */
  confirmCancel(): void {
    if (! this.orderToCancel) return;

    this.actionLoading = true;
    this.error = '';

    this.orderService.cancelOrder(this.orderToCancel.id)
      . pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadOrders(true);
          this.closeCancelModal();
        },
        error: (error: Error) => {
          this.error = error.message;
          this.actionLoading = false;
        }
      });
  }

  /**
   * Vérifie si une commande peut être annulée
   */
  canCancelOrder(order: Order): boolean {
    return order.status === 'pending';
  }

  /**
   * Voir les détails d'une commande
   */
  viewOrderDetails(order: Order): void {
    this.router.navigate(['/client/orders', order.id]);
  }

  /**
   * Rafraîchit la liste des commandes
   */
  refresh(): void {
    this.loadOrders(true);
  }

  /**
   * Obtient le libellé du statut
   */
  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  /**
   * Obtient les classes CSS du badge de statut
   */
  getStatusBadgeClass(status: string): string {
    return this.orderService.getStatusBadgeClass(status);
  }

  /**
   * Obtient l'icône du statut
   */
  getStatusIcon(status: string): string {
    return this.orderService. getStatusIcon(status);
  }

  /**
   * Vérifie si une commande est en attente
   */
  isPending(order: Order): boolean {
    return order.status === 'pending';
  }

  /**
   * Vérifie si une commande est livrée (en attente de validation)
   */
  isDelivered(order: Order): boolean {
    return order.status === 'delivered';
  }

  /**
   * Formate le montant en devise
   */
  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Formate une date
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl. DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Retourne les initiales du freelance
   */
  getFreelanceInitials(order: Order): string {
    const freelance = order.service_offer?. service?.freelance;
    if (!freelance?. user) return '?? ';
    const firstInitial = freelance.user.full_name?. charAt(0).toUpperCase() || '';
    return firstInitial || '??';
  }

  /**
   * Obtient le nom complet du freelance
   */
  getFreelanceName(order: Order): string {
    const freelance = order.service_offer?.service?.freelance;
    if (!freelance?.user) return 'Freelance inconnu';
    return freelance.user.full_name?. trim() || 'Freelance';
  }

  /**
   * Obtient l'email du freelance
   */
  getFreelanceEmail(order: Order): string {
    return order.service_offer?.service?. freelance?.user?.email || 'N/A';
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

  /**
   * Récupère le service via l'offre
   */
  getService(order: Order): Service | undefined {
    return order.service_offer?.service;
  }

  /**
   * Récupère le délai de livraison de l'offre sélectionnée
   */
  getDeliveryDays(order: Order): number {
    return order.service_offer?.delivery_days || 0;
  }

  /**
   * Récupère le nombre de révisions de l'offre
   */
  getRevisions(order: Order): number {
    return order.service_offer?. number_of_revisions || 0;
  }

  /**
   * Récupère le titre de l'offre (Starter, Standard, Advanced)
   */
  getOfferTitle(order: Order): string {
    return order.service_offer?.title || '';
  }

  /**
   * Récupère le titre du service
   */
  getServiceTitle(order: Order): string {
    return order.service_offer?.service?.title || 'Service inconnu';
  }

  /**
   * Récupère la catégorie du service
   */
  getServiceCategory(order: Order): string {
    return order. service_offer?.service?.category?. name || 'Non catégorisé';
  }

  /**
   * Vérifie si la commande a une image de service
   */
  hasServiceImage(order: Order): boolean {
    return ! !(order.service_offer?.service?.images && order.service_offer. service.images.length > 0);
  }


  /**
   * Récupère le délai de livraison formaté
   */
  formatDeliveryDays(order: Order): string {
    const days = order.service_offer?.delivery_days || 0;
    return `${days} jour${days > 1 ? 's' : ''}`;
  }
}
