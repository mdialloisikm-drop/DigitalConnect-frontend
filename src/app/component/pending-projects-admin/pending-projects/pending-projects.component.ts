import {Component, OnInit} from '@angular/core';
import {Project} from "../../../models/project";
import {AdminModerationService} from "../../../services/admin-moderation.service";
import {Router} from "@angular/router";
import {environment} from "../../../../environments/environment";

@Component({
  selector: 'app-pending-projects',
  templateUrl: './pending-projects.component.html',
  styleUrl: './pending-projects.component.css'
})
export class PendingProjectsComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  error = false;
  errorMessage = '';

  // Pour la modal de rejet
  showRejectModal = false;
  projectToReject: Project | null = null;
  rejectReason = '';
  rejectLoading = false;

  // Pour la modal de confirmation d'approbation
  showApproveModal = false;
  projectToApprove: Project | null = null;
  approveLoading = false;

  constructor(
    private moderationService: AdminModerationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPendingProjects();
  }

  /**
   * Charger les projets en attente
   */
  loadPendingProjects(): void {
    this.loading = true;
    this.error = false;

    this.moderationService.getPendingProjects().subscribe({
      next: (response) => {
        this.projects = response.data || response;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des projets:', error);
        this.error = true;
        this.errorMessage = 'Impossible de charger les projets en attente';
        this.loading = false;
      }
    });
  }


  /**
   * Tronquer la description
   */
  truncateDescription(description: string, maxLength: number = 100): string {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  }

  /**
   * Voir les détails du projet
   */
  viewProjectDetails(projectId: number): void {
    this.router.navigate(['/admin/projects/details', projectId]);
  }

  /**
   * Ouvrir la modal d'approbation
   */
  openApproveModal(project: Project): void {
    this.projectToApprove = project;
    this.showApproveModal = true;
  }

  /**
   * Fermer la modal d'approbation
   */
  closeApproveModal(): void {
    this.projectToApprove = null;
    this.showApproveModal = false;
  }

  /**
   * Confirmer l'approbation
   */
  confirmApprove(): void {
    if (!this.projectToApprove) return;

    this.approveLoading = true;

    this.moderationService.approveProject(this.projectToApprove.id).subscribe({
      next: (response) => {
        // Retirer le projet de la liste
        this.projects = this.projects.filter(p => p.id !== this.projectToApprove?.id);
        this.approveLoading = false;
        this.closeApproveModal();

        // Afficher un message de succès
        this.showSuccessMessage('Projet approuvé avec succès');
      },
      error: (error) => {
        console.error('Erreur lors de l\'approbation:', error);
        this.approveLoading = false;
        alert('Erreur lors de l\'approbation du projet');
      }
    });
  }

  /**
   * Ouvrir la modal de rejet
   */
  openRejectModal(project: Project): void {
    this.projectToReject = project;
    this.rejectReason = '';
    this.showRejectModal = true;
  }

  /**
   * Fermer la modal de rejet
   */
  closeRejectModal(): void {
    this.projectToReject = null;
    this.rejectReason = '';
    this.showRejectModal = false;
  }

  /**
   * Confirmer le rejet
   */
  confirmReject(): void {
    if (!this.projectToReject) return;

    this.rejectLoading = true;

    this.moderationService.rejectProject(this.projectToReject.id, this.rejectReason).subscribe({
      next: (response) => {
        // Retirer le projet de la liste
        this.projects = this.projects.filter(p => p.id !== this.projectToReject?.id);
        this.rejectLoading = false;
        this.closeRejectModal();

        // Afficher un message de succès
        this.showSuccessMessage('Projet rejeté avec succès');
      },
      error: (error) => {
        console.error('Erreur lors du rejet:', error);
        this.rejectLoading = false;
        alert('Erreur lors du rejet du projet');
      }
    });
  }

  /**
   * Afficher un message de succès
   */
  private showSuccessMessage(message: string): void {
    // Vous pouvez utiliser un service de notification ou un toast
    alert(message);
  }

  formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
  }
}
