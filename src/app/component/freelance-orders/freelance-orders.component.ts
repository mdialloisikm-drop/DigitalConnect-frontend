import {Component, OnDestroy, OnInit} from '@angular/core';
import {OrderService} from "../../services/order.service";
import {Order} from "../../models/order";
import {Router} from "@angular/router";
import {Subject, takeUntil} from "rxjs";

@Component({
  selector: 'app-freelance-orders',
  templateUrl: './freelance-orders.component.html',
  styleUrl: './freelance-orders.component.css'
})
export class FreelanceOrdersComponent implements OnInit, OnDestroy {
  // Liste des commandes
  orders: Order[] = [];
  filteredOrders: Order[] = [];

  // États de l'interface
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';

  // Modal de confirmation
  showAcceptModal: boolean = false;
  showRefuseModal: boolean = false;
  orderToProcess: Order | null = null;
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les commandes du freelance
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
          this.calculateStats();
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
    let filtered = [...this.orders];

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
   * Ouvre le modal de confirmation d'acceptation
   */
  openAcceptModal(event: Event, order: Order): void {
    event.stopPropagation();
    if (!this.orderService.canAcceptOrder(order)) {
      this.error = 'Cette commande ne peut pas être acceptée';
      return;
    }
    this.orderToProcess = order;
    this.showAcceptModal = true;
  }

  /**
   * Ferme le modal d'acceptation
   */
  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.orderToProcess = null;
    this.actionLoading = false;
  }

  /**
   * Confirme l'acceptation d'une commande
   */
  confirmAccept(): void {
    if (!this.orderToProcess) return;

    this.actionLoading = true;
    this.error = '';

    this.orderService.acceptOrder(this.orderToProcess.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadOrders(true);
          this.closeAcceptModal();
        },
        error: (error: Error) => {
          this.error = error.message;
          this.actionLoading = false;
        }
      });
  }

  /**
   * Ouvre le modal de confirmation de refus
   */
  openRefuseModal(event: Event, order: Order): void {
    event.stopPropagation();
    if (!this.orderService.canCancelOrder(order)) {
      this.error = 'Cette commande ne peut pas être refusée';
      return;
    }
    this.orderToProcess = order;
    this.showRefuseModal = true;
  }

  /**
   * Ferme le modal de refus
   */
  closeRefuseModal(): void {
    this.showRefuseModal = false;
    this.orderToProcess = null;
    this.actionLoading = false;
  }

  /**
   * Confirme le refus d'une commande
   */
  confirmRefuse(): void {
    if (!this.orderToProcess) return;

    this.actionLoading = true;
    this.error = '';

    this.orderService.cancelOrder(this.orderToProcess.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadOrders(true);
          this.closeRefuseModal();
        },
        error: (error: Error) => {
          this.error = error.message;
          this.actionLoading = false;
        }
      });
  }

  /**
   * Voir les détails d'une commande
   */
  viewOrderDetails(order: Order): void {
    this.router.navigate(['/freelance/order', order.id]);
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
    return this.orderService.getStatusIcon(status);
  }

  /**
   * Vérifie si une commande est en attente
   */
  isPending(order: Order): boolean {
    return order.status === 'pending';
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
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  /**
   * Retourne les initiales du client
   */
  getClientInitials(order: Order): string {
    if (!order.client?.user) return '??';
    const user = order.client.user;
    const firstInitial = user.full_name?.charAt(0).toUpperCase() || '';
    return firstInitial || '??';
  }

  /**
   * Obtient le nom complet du client
   */
  getClientName(order: Order): string {
    if (!order.client?.user) return 'Client inconnu';
    return order.client.user.full_name?.trim() || 'Client';
  }

  getImageUrl(path: string): string {
    return `http://localhost:8000/storage/${path}`;
  }

}
