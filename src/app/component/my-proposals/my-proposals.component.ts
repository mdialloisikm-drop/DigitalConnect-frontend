import {Component, OnDestroy, OnInit} from '@angular/core';
import {Proposal} from "../../models/proposal";
import {Subject, takeUntil} from "rxjs";
import {ProposalService} from "../../services/proposal.service";

@Component({
  selector: 'app-my-proposals',
  templateUrl: './my-proposals.component.html',
  styleUrl: './my-proposals.component.css'
})
export class MyProposalsComponent implements OnInit, OnDestroy {
  // Liste des propositions
  proposals: Proposal[] = [];
  filteredProposals: Proposal[] = [];

  // États de l'interface
  loading: boolean = false;
  error: string = '';
  selectedFilter: string = 'all';
  searchTerm: string = '';

  // Modal de confirmation d'annulation
  showCancelModal: boolean = false;
  proposalToCancel: Proposal | null = null;
  cancelLoading: boolean = false;

  // Modal de détails
  showDetailsModal: boolean = false;
  selectedProposal: Proposal | null = null;

  // Statistiques
  stats = {
    total: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    acceptanceRate: 0
  };

  // Subject pour la désinscription
  private destroy$ = new Subject<void>();

  constructor(public proposalService: ProposalService) {}

  ngOnInit(): void {
    this.loadProposals();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge toutes les propositions du freelance
   */
  loadProposals(forceRefresh: boolean = false): void {
    this.loading = true;
    this.error = '';

    this.proposalService.getMyProposals(forceRefresh)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (proposals: Proposal[]) => {
          this.proposals = proposals;
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
   * Applique les filtres et la recherche
   */
  applyFilters(): void {
    let filtered = [...this.proposals];

    // Filtre par statut
    filtered = this.proposalService.filterByStatus(filtered, this.selectedFilter);

    // Filtre par recherche (titre du projet)
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.project?.title?.toLowerCase().includes(term) ||
        p.project?.description?.toLowerCase().includes(term)
      );
    }

    // Trie par date (plus récentes en premier)
    this.filteredProposals = this.proposalService.sortByDate(filtered);
  }

  /**
   * Change le filtre de statut
   */
  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  /**
   * Recherche dans les propositions
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Calcule les statistiques
   */
  calculateStats(): void {
    this.stats = this.proposalService.getProposalStats(this.proposals);
  }

  /**
   * Ouvre le modal de détails d'une proposition
   */
  viewDetails(proposal: Proposal): void {
    this.selectedProposal = proposal;
    this.showDetailsModal = true;
  }

  /**
   * Ferme le modal de détails
   */
  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedProposal = null;
  }

  /**
   * Ouvre le modal de confirmation d'annulation
   */
  openCancelModal(proposal: Proposal): void {
    if (!this.proposalService.canCancelProposal(proposal)) {
      this.error = 'Cette proposition ne peut pas être annulée';
      return;
    }
    this.proposalToCancel = proposal;
    this.showCancelModal = true;
  }

  /**
   * Ferme le modal de confirmation d'annulation
   */
  closeCancelModal(): void {
    this.showCancelModal = false;
    this.proposalToCancel = null;
    this.cancelLoading = false;
  }

  /**
   * Confirme l'annulation d'une proposition
   */
  confirmCancel(): void {
    if (!this.proposalToCancel) return;

    this.cancelLoading = true;
    this.error = '';

    this.proposalService.cancelProposal(this.proposalToCancel.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Recharger la liste
          this.loadProposals(true);
          this.closeCancelModal();
          // Afficher un message de succès (vous pouvez utiliser un service de notification)
        },
        error: (error: Error) => {
          this.error = error.message;
          this.cancelLoading = false;
        }
      });
  }

  /**
   * Rafraîchit la liste des propositions
   */
  refresh(): void {
    this.loadProposals(true);
  }

  /**
   * Obtient le libellé du statut
   */
  getStatusLabel(status: string): string {
    return this.proposalService.getStatusLabel(status);
  }

  /**
   * Obtient les classes CSS du badge de statut
   */
  getStatusBadgeClass(status: string): string {
    return this.proposalService.getStatusBadgeClass(status);
  }

  /**
   * Obtient l'icône du statut
   */
  getStatusIcon(status: string): string {
    return this.proposalService.getStatusIcon(status);
  }

  /**
   * Vérifie si une proposition peut être annulée
   */
  canCancel(proposal: Proposal): boolean {
    return this.proposalService.canCancelProposal(proposal);
  }

  /**
   * Formate le montant en devise
   */
  // formatAmount(amount: number): string {
  //   return new Intl.NumberFormat('fr-FR', {
  //     style: 'currency',
  //     currency: 'USD',
  //     minimumFractionDigits: 0
  //   }).format(amount);
  // }

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Formate la durée en jours
   */
  formatDuration(days: number): string {
    if (days === 1) return '1 jour';
    if (days < 7) return `${days} jours`;
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    if (remainingDays === 0) {
      return weeks === 1 ? '1 semaine' : `${weeks} semaines`;
    }
    return `${weeks} semaine${weeks > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
  }

  /**
   * Formate une date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Calcule le temps écoulé depuis la création
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;

    return this.formatDate(dateString);
  }

  /**
   * Retourne les initiales du client
   */
  getClientInitials(proposal: Proposal): string {
    if (!proposal.project?.client?.user) return '??';
    const user = proposal.project.client.user;
    const firstInitial = user.full_name?.charAt(0).toUpperCase() || '';
    return firstInitial || '??';
  }

  /**
   * Obtient le nom complet du client
   */
  getClientName(proposal: Proposal): string {
    if (!proposal.project?.client?.user) return 'Client inconnu';
    const user = proposal.project.client.user;
    return `${user.full_name || ''}`.trim() || 'Client';
  }
}
