import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from "rxjs";
import {Proposal} from "../../models/proposal";
import {Project} from "../../models/project";
import {ActivatedRoute, Router} from "@angular/router";
import {ClientService} from "../../services/client.service";
import {ProjectService} from "../../services/project.service";

interface ProposalWithActions extends Proposal {
  isAccepting?: boolean;
  isRejecting?: boolean;
}

@Component({
  selector: 'app-client-proposal-details',
  templateUrl: './client-proposal-details.component.html',
  styleUrl: './client-proposal-details.component.css'
})
export class ClientProposalDetailsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  projectId!: number;
  project: Project | null = null;
  proposals: ProposalWithActions[] = [];

  isLoadingProject = false;
  isLoadingProposals = false;
  errorMessage = '';
  successMessage = '';

  // Filtres
  statusFilter: 'all' | 'pending' | 'accepted' | 'rejected' = 'all';
  sortBy: 'date' | 'amount' | 'duration' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal pour la raison du rejet
  showRejectModal = false;
  selectedProposalId: number | null = null;
  rejectReason = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly clientService: ClientService,
    private readonly projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.projectId = +params['id'];
        this.loadProjectDetails();
        this.loadProposals();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les détails du projet
   */
  loadProjectDetails(): void {
    this.isLoadingProject = true;

    this.projectService.getProjectById(this.projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProject = false)
      )
      .subscribe({
        next: (project) => {
          this.project = project;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement du projet';
          console.error('Erreur:', error);
        }
      });
  }

  /**
   * Charge les candidatures du projet
   */
  loadProposals(): void {
    this.isLoadingProposals = true;
    this.errorMessage = '';

    this.clientService.getMyProposals(this.projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProposals = false)
      )
      .subscribe({
        next: (proposals) => {
          this.proposals = proposals;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des candidatures';
          console.error('Erreur:', error);
        }
      });
  }

  /**
   * Accepter une candidature
   */
  acceptProposal(proposal: ProposalWithActions): void {
    if (!confirm(`Êtes-vous sûr de vouloir accepter la candidature de ${proposal.freelance?.user?.full_name || 'ce freelance'} ?\n\nCela créera automatiquement un contrat.`)) {
      return;
    }

    proposal.isAccepting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clientService.acceptProposal(proposal.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => proposal.isAccepting = false)
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Candidature acceptée avec succès';
          this.loadProposals();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de l\'acceptation';
          console.error('Erreur:', error);
        }
      });
  }

  /**
   * Ouvrir le modal de rejet
   */
  openRejectModal(proposalId: number): void {
    this.selectedProposalId = proposalId;
    this.showRejectModal = true;
    this.rejectReason = '';
  }

  /**
   * Fermer le modal de rejet
   */
  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedProposalId = null;
    this.rejectReason = '';
  }

  /**
   * Rejeter une candidature
   */
  confirmRejectProposal(): void {
    if (!this.selectedProposalId) return;

    const proposal = this.proposals.find(p => p.id === this.selectedProposalId);
    if (!proposal) return;

    proposal.isRejecting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clientService.rejectProposal(this.selectedProposalId, this.rejectReason)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          proposal.isRejecting = false;
          this.closeRejectModal();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Candidature rejetée';
          this.loadProposals();
          setTimeout(() => this.successMessage = '', 5000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du rejet';
          console.error('Erreur:', error);
        }
      });
  }

  /**
   * Obtenir les candidatures filtrées et triées
   */
  get filteredAndSortedProposals(): ProposalWithActions[] {
    let filtered = [...this.proposals];

    // Filtrer par statut
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    // Trier
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'amount':
          comparison = Number(a.proposed_amount) - Number(b.proposed_amount);
          break;
        case 'duration':
          comparison = a.proposed_duration - b.proposed_duration;
          break;
      }

      return this.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }

  /**
   * Obtenir le badge de statut
   */
  getStatusBadge(status: string): { class: string; label: string; icon: string } {
    const badges: Record<string, { class: string; label: string; icon: string }> = {
      pending: { class: 'bg-yellow-100 text-yellow-800', label: 'En attente', icon: 'fa-clock' },
      accepted: { class: 'bg-green-100 text-green-800', label: 'Acceptée', icon: 'fa-check-circle' },
      rejected: { class: 'bg-red-100 text-red-800', label: 'Rejetée', icon: 'fa-times-circle' }
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status, icon: 'fa-question' };
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formater la durée
   */
  formatDuration(days: number): string {
    if (!days) return 'Non définie';

    if (days < 7) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mois`;
    } else {
      const years = Math.floor(days / 365);
      return `${years} an${years > 1 ? 's' : ''}`;
    }
  }

  /**
   * Retourner à la liste des candidatures
   */
  goBack(): void {
    this.router.navigate(['/client/proposals']);
  }

  /**
   * Obtenir les statistiques des candidatures
   */
  get proposalStats() {
    return {
      total: this.proposals.length,
      pending: this.proposals.filter(p => p.status === 'pending').length,
      accepted: this.proposals.filter(p => p.status === 'accepted').length,
      rejected: this.proposals.filter(p => p.status === 'rejected').length
    };
  }
}
