import {Component, OnDestroy, OnInit} from '@angular/core';
import {Project} from "../../models/project";
import {finalize, Subject, takeUntil} from "rxjs";
import {ClientService} from "../../services/client.service";
import {Router} from "@angular/router";

interface ProjectWithProposals extends Project {
  proposalCount?: number;
  pendingProposalCount?: number;
}

@Component({
  selector: 'app-client-proposals',
  templateUrl: './client-proposals.component.html',
  styleUrl: './client-proposals.component.css'
})
export class ClientProposalsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  projects: ProjectWithProposals[] = [];
  isLoading = false;
  errorMessage = '';

  // Filtres
  searchQuery = '';
  statusFilter: 'all' | 'open' = 'open';

  constructor(
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadOpenProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les projets ouverts avec leurs candidatures
   */
  loadOpenProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getAllMyProjects()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (projects) => {
          // Filtrer selon le filtre de statut
          let filteredProjects = projects;
          if (this.statusFilter === 'open') {
            filteredProjects = projects.filter(p => p.status === 'open');
          }

          this.projects = filteredProjects;

          // Charger le nombre de candidatures pour chaque projet
          this.loadProposalCounts();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des projets';
          console.error('Erreur:', error);
        }
      });
  }

  /**
   * Charge le nombre de candidatures pour chaque projet
   */
  private loadProposalCounts(): void {
    this.projects.forEach(project => {
      this.clientService.getMyProposals(project.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (proposals) => {
            project.proposalCount = proposals.length;
            project.pendingProposalCount = proposals.filter(p => p.status === 'pending').length;
          },
          error: (error) => {
            console.error(`Erreur lors du chargement des propositions pour le projet ${project.id}:`, error);
            project.proposalCount = 0;
            project.pendingProposalCount = 0;
          }
        });
    });
  }

  /**
   * Naviguer vers la page de détails des candidatures d'un projet
   */
  viewProjectProposals(projectId: number): void {
    this.router.navigate(['/client/proposals', projectId]);
  }

  /**
   * Obtenir les projets filtrés
   */
  get filteredProjects(): ProjectWithProposals[] {
    let filtered = this.projects;

    // Filtre par recherche
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }

    return filtered;
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

  formatAmount(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Formater la date
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtenir le badge de statut
   */
  getStatusBadge(status: string): { class: string; label: string } {
    const badges: Record<string, { class: string; label: string }> = {
      open: { class: 'bg-green-100 text-green-800', label: 'Ouvert' },
      in_progress: { class: 'bg-blue-100 text-blue-800', label: 'En cours' },
      completed: { class: 'bg-gray-100 text-gray-800', label: 'Terminé' },
      cancelled: { class: 'bg-red-100 text-red-800', label: 'Annulé' }
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status };
  }

  /**
   * Changer le filtre de statut
   */
  changeStatusFilter(status: 'all' | 'open'): void {
    this.statusFilter = status;
    this.loadOpenProjects();
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
}
