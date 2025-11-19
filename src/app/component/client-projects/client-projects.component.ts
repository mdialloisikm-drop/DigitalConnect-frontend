import {Component, OnDestroy, OnInit} from '@angular/core';
import {Project} from "../../models/project";
import {finalize, Subject, takeUntil} from "rxjs";
import {ClientService} from "../../services/client.service";
import {Router} from "@angular/router";

interface ProjectListItem extends Project {
  isDeleting?: boolean;
}

@Component({
  selector: 'app-client-projects',
  templateUrl: './client-projects.component.html',
  styleUrl: './client-projects.component.css'
})
export class ClientProjectsComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  projects: ProjectListItem[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Modal
  showModal = false;
  selectedProject: Project | null = null;
  isLoadingProjectDetails = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalProjects = 0;
  perPage = 10;

  // Filtres
  statusFilter: string = 'all';
  searchQuery = '';

  readonly statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'en_attente', label: 'En attente' },
    { value: 'open', label: 'Ouvert' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Terminé' },
    { value: 'cancelled', label: 'Annulé' },
    { value: 'archived', label: 'Archivé' }
  ];

  constructor(
    private readonly clientService: ClientService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger la liste des projets
   */
  loadProjects(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getMyProjects(this.currentPage, this.perPage)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (Array.isArray(response)) {
            this.projects = response;
            this.totalProjects = response.length;
            this.totalPages = Math.ceil(response.length / this.perPage);
          } else if (response && 'data' in response) {
            this.projects = response.data || [];
            this.totalProjects = response.total || 0;
            this.totalPages = response.last_page || 1;
            this.currentPage = response.current_page || 1;
          } else {
            this.projects = [];
          }
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des projets';
          this.projects = [];
        }
      });
  }

  /**
   * Naviguer vers la page de création de projet
   */
  createProject(): void {
    this.router.navigate(['/client/projects/new']);
  }

  /**
   * Naviguer vers la page d'édition de projet
   */
  editProject(projectId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/client/projects', projectId, 'edit']);
  }

  /**
   * Voir les détails d'un projet dans une modal
   */
  viewProject(projectId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.isLoadingProjectDetails = true;
    this.showModal = true;
    this.errorMessage = '';

    this.clientService.getProjectById(projectId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoadingProjectDetails = false)
      )
      .subscribe({
        next: (project) => {
          this.selectedProject = project;
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement du projet';
          this.closeModal();
        }
      });
  }

  /**
   * Naviguer vers la page de gestion du projet (cliquable sur la card)
   */
  manageProject(projectId: number): void {
    this.router.navigate(['/client/projects', projectId, 'manage']);
  }

  /**
   * Fermer la modal
   */
  closeModal(): void {
    this.showModal = false;
    this.selectedProject = null;
    this.isLoadingProjectDetails = false;
  }

  /**
   * Supprimer un projet
   */
  deleteProject(project: ProjectListItem, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.title}" ?`)) {
      return;
    }

    project.isDeleting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.clientService.deleteProject(project.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => project.isDeleting = false)
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message || 'Projet supprimé avec succès';
          this.loadProjects();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          this.errorMessage = error.message || 'Erreur lors de la suppression';
        }
      });
  }

  /**
   * Changer de page
   */
  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.loadProjects();
  }

  /**
   * Obtenir le badge de statut avec traduction
   */
  getStatusBadge(status: string): { class: string; label: string } {
    const badges: Record<string, { class: string; label: string }> = {
      'en_attente': { class: 'bg-yellow-100 text-yellow-800', label: 'En attente' },
      'open': { class: 'bg-green-100 text-green-800', label: 'Ouvert' },
      'in_progress': { class: 'bg-blue-100 text-blue-800', label: 'En cours' },
      'completed': { class: 'bg-gray-100 text-gray-800', label: 'Terminé' },
      'cancelled': { class: 'bg-red-100 text-red-800', label: 'Annulé' },
      'archived': { class: 'bg-purple-100 text-purple-800', label: 'Archivé' }
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', label: status };
  }

  /**
   * Vérifier si un projet est en cours
   */
  isInProgress(status: string): boolean {
    return status === 'in_progress';
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
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Obtenir les projets filtrés
   */
  get filteredProjects(): ProjectListItem[] {
    let filtered = [...this.projects];

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

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
   * Formater la durée
   */
  formatDuration(days: number): string {
    if (!days) return 'Non définie';

    if (days < 7) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    } else if (days < 30) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      if (remainingDays === 0) {
        return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
      }
      return `${weeks} semaine${weeks > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    } else if (days < 365) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays === 0) {
        return `${months} mois`;
      }
      return `${months} mois et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      if (remainingDays === 0) {
        return `${years} an${years > 1 ? 's' : ''}`;
      }
      return `${years} an${years > 1 ? 's' : ''} et ${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    }
  }

  /**
   * Obtenir la progression du projet (0-100)
   */
  getProjectProgress(project: Project): number {
    return project.progress || 0;
  }

  /**
   * Obtenir la classe CSS pour la barre de progression
   */
  getProgressBarClass(progress: number): string {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
