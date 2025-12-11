import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
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

  isLoadingProject = true;
  isLoadingProposals = true;
  errorMessage = '';
  successMessage = '';

  // Filtres
  statusFilter: 'all' | 'pending' | 'accepted' | 'rejected' = 'all';
  sortBy: 'date' | 'amount' | 'duration' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Modal pour le rejet
  showRejectModal = false;
  selectedProposalId: number | null = null;
  rejectReason = '';

  // Modal pour l'acceptation
  showAcceptModal = false;
  selectedProposal: ProposalWithActions | null = null;
  isAccepting = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly clientService: ClientService,
    private readonly projectService: ProjectService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.projectId = +params['id'];
        this.loadData();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
  }

  /**
   * Charge toutes les données
   */
  private loadData(): void {
    this.loadProjectDetails();
    this.loadProposals();
  }

  /**
   * Charge les détails du projet
   */
  loadProjectDetails(): void {
    this.isLoadingProject = true;

    this.projectService.getProjectById(this.projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoadingProject = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (project) => {
          this.project = project;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement du projet';
          this.cdr.markForCheck();
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
        finalize(() => {
          this.isLoadingProposals = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (proposals) => {
          this.proposals = proposals;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this. errorMessage = error.message || 'Erreur lors du chargement des candidatures';
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Ouvrir le modal d'acceptation
   */
  openAcceptModal(proposal: ProposalWithActions): void {
    this.selectedProposal = proposal;
    this. showAcceptModal = true;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  /**
   * Fermer le modal d'acceptation
   */
  closeAcceptModal(): void {
    this.showAcceptModal = false;
    this.selectedProposal = null;
    this.isAccepting = false;
    document.body.style. overflow = '';
    this.cdr.markForCheck();
  }

  /**
   * Confirmer l'acceptation
   */
  confirmAcceptProposal(): void {
    if (!this.selectedProposal) return;

    this.isAccepting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.clientService.acceptProposal(this. selectedProposal.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isAccepting = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Candidature acceptée avec succès';
          this.closeAcceptModal();
          this. loadProposals();
          this.autoCloseMessage();
        },
        error: (error) => {
          this.errorMessage = error. message || 'Erreur lors de l\'acceptation';
          this.closeAcceptModal();
          this. cdr.markForCheck();
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
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  /**
   * Fermer le modal de rejet
   */
  closeRejectModal(): void {
    this.showRejectModal = false;
    this.selectedProposalId = null;
    this.rejectReason = '';
    document. body.style.overflow = '';
    this.cdr.markForCheck();
  }

  /**
   * Confirmer le rejet
   */
  confirmRejectProposal(): void {
    if (!this. selectedProposalId) return;

    const proposal = this.proposals.find(p => p.id === this. selectedProposalId);
    if (!proposal) return;

    proposal.isRejecting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    this.clientService.rejectProposal(this.selectedProposalId, this.rejectReason)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          proposal.isRejecting = false;
          this.closeRejectModal();
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Candidature rejetée';
          this.loadProposals();
          this.autoCloseMessage();
        },
        error: (error) => {
          this.errorMessage = error. message || 'Erreur lors du rejet';
          this. cdr.markForCheck();
        }
      });
  }

  /**
   * Ferme automatiquement les messages après 5s
   */
  private autoCloseMessage(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.markForCheck();
    }, 5000);
  }

  /**
   * Fermer le message de succès
   */
  closeSuccessMessage(): void {
    this.successMessage = '';
    this.cdr.markForCheck();
  }

  /**
   * Fermer le message d'erreur
   */
  closeErrorMessage(): void {
    this.errorMessage = '';
    this.cdr.markForCheck();
  }

  /**
   * Obtenir les candidatures filtrées et triées
   */
  get filteredAndSortedProposals(): ProposalWithActions[] {
    let filtered = [...this.proposals];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    filtered.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b. created_at).getTime();
          break;
        case 'amount':
          comparison = Number(a.proposed_amount) - Number(b.proposed_amount);
          break;
        case 'duration':
          comparison = a. proposed_duration - b.proposed_duration;
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
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Formater la durée
   */
  formatDuration(days: number): string {
    if (!days) return 'Non définie';
    if (days < 7) return `${days} jour${days > 1 ? 's' : ''}`;
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    if (days < 365) {
      const months = Math.floor(days / 30);
      return `${months} mois`;
    }
    const years = Math.floor(days / 365);
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  /**
   * Retourner à la liste
   */
  goBack(): void {
    this.router.navigate(['/client/proposals']);
  }

  /**
   * Statistiques des candidatures
   */
  get proposalStats() {
    return {
      total: this.proposals.length,
      pending: this.proposals.filter(p => p.status === 'pending').length,
      accepted: this.proposals.filter(p => p.status === 'accepted').length,
      rejected: this.proposals.filter(p => p.status === 'rejected').length
    };
  }

  /**
   * TrackBy pour ngFor
   */
  trackByProposalId(index: number, proposal: ProposalWithActions): number {
    return proposal.id;
  }

  /**
   * TrackBy pour skills
   */
  trackBySkillId(index: number, skill: any): number {
    return skill. id || index;
  }

  /**
   * Obtenir l'avatar du freelance
   */
  getFreelanceAvatar(proposal: ProposalWithActions): string {
    if (proposal.freelance?.user?.avatar) {
      if (proposal.freelance.user. avatar.startsWith('http')) {
        return proposal.freelance. user.avatar;
      }
      return `http://localhost:8000/storage/avatars/${proposal.freelance.user.avatar}`;
    }
    const name = proposal.freelance?.user?. full_name || 'User';
    return `https://ui-avatars.com/api/? name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }
}
