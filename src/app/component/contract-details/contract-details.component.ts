import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from "rxjs";
import {Contract} from "../../models/contract";
import {ActivatedRoute, Router} from "@angular/router";
import {Attachement} from "../../models/attachement";
import {ContractService} from "../../services/contract.service";
import {AttachementService} from "../../services/attachement.service";
import {ProjectService} from "../../services/project.service";
import {Project} from "../../models/project";
import {TaskService} from "../../services/task.service";
import {Task} from "../../models/task";

@Component({
  selector: 'app-contract-details',
  templateUrl: './contract-details.component.html',
  styleUrl: './contract-details.component.css'
})
export class ContractDetailsComponent implements OnInit, OnDestroy {
  contract: Contract | null = null;
  activeTab: 'project' | 'tasks' | 'deliverables' | 'terms' = 'project';
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Tâches
  tasks: Task[] = [];
  isLoadingTasks = false;
  completingTaskId: number | null = null;

  // Livrables
  deliverables: Attachement[] = [];
  selectedFiles: File[] = [];
  isUploadingFiles = false;
  linkName = '';
  linkUrl = '';
  isAddingLink = false;

  private destroy$ = new Subject<void>();

  constructor(
    private contractService: ContractService,
    private attachementService: AttachementService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadContractDetails();
  }

  ngOnDestroy(): void {
    this.destroy$. next();
    this.destroy$.complete();
  }

  /**
   * Charger les détails du contrat
   */
  private loadContractDetails(): void {
    const contractId = this.route.snapshot.params['id'];
    if (! contractId) {
      this.router.navigate(['/freelance/contracts']);
      return;
    }

    this.isLoading = true;
    this. errorMessage = '';

    this. contractService.getContractById(Number(contractId))
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (contract: Contract) => {
          this. contract = contract;
          this. loadDeliverables();
          this.loadTasks();
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Charger les tâches du projet
   */
  private loadTasks(): void {
    if (!this.contract?.project_id) return;

    this.isLoadingTasks = true;
    this.cdr.markForCheck();

    this.taskService.getProjectTasks(this.contract.project_id)
      .pipe(
        takeUntil(this. destroy$),
        finalize(() => {
          this.isLoadingTasks = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (tasks: Task[]) => {
          this.tasks = tasks;
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des tâches:', error);
          this.tasks = [];
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Marquer une tâche comme terminée
   */
  completeTask(task: Task): void {
    if (!task.id || task.status === 'completed') return;

    this.completingTaskId = task.id;
    this.clearMessages();
    this.cdr.markForCheck();

    this.taskService.completeTask(task.id)
      . pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.completingTaskId = null;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this. successMessage = 'Tâche marquée comme terminée';
          // Mettre à jour la tâche localement
          const index = this.tasks.findIndex(t => t.id === task. id);
          if (index !== -1) {
            this. tasks[index] = { ...this.tasks[index], status: 'completed' };
            this.tasks = [...this.tasks]; // Trigger change detection
          }
          this. autoCloseMessage();
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Erreur lors de la mise à jour de la tâche';
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Charger les livrables depuis le projet
   */
  private loadDeliverables(): void {
    if (!this.contract?. project_id) return;

    this.projectService.getProjectById(this.contract.project_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project: Project) => {
          this.deliverables = project.attachments?. filter(
            attachment => attachment.file_type === 'deliverable'
          ) || [];
          this.cdr.markForCheck();
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement des livrables:', error);
          this.deliverables = [];
          this. cdr.markForCheck();
        }
      });
  }

  /**
   * Changer d'onglet
   */
  changeTab(tab: 'project' | 'tasks' | 'deliverables' | 'terms'): void {
    this.activeTab = tab;
    this.clearMessages();
    this.cdr.markForCheck();
  }

  /**
   * Gérer la sélection de fichiers
   */
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      this.cdr.markForCheck();
    }
  }

  /**
   * Uploader des fichiers livrables
   */
  uploadDeliverables(): void {
    if (!this.contract?.project_id || this.selectedFiles.length === 0) return;

    this.isUploadingFiles = true;
    this.clearMessages();
    this.cdr.markForCheck();

    this.attachementService.addProjectDeliverables(this.contract. project_id, this.selectedFiles)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isUploadingFiles = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.selectedFiles = [];
          this.loadDeliverables();
          this.autoCloseMessage();

          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        },
        error: (error: Error) => {
          this. errorMessage = error.message;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Ajouter un lien comme livrable
   */
  addDeliverableLink(): void {
    if (!this.contract?.project_id || !this.linkName || !this.linkUrl) return;

    this.isAddingLink = true;
    this. clearMessages();
    this.cdr.markForCheck();

    this.attachementService.addProjectDeliverableLink(this.contract.project_id, this.linkName, this.linkUrl)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isAddingLink = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this. linkName = '';
          this. linkUrl = '';
          this. loadDeliverables();
          this.autoCloseMessage();
        },
        error: (error: Error) => {
          this. errorMessage = error.message;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Supprimer un fichier sélectionné
   */
  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.cdr.markForCheck();
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
   * Obtenir les statistiques des tâches
   */
  get taskStats() {
    return {
      total: this.tasks.length,
      completed: this.tasks.filter(t => t.status === 'completed').length,
      pending: this.tasks.filter(t => t.status === 'pending').length,
      inProgress: this.tasks.filter(t => t.status === 'in_progress').length
    };
  }

  /**
   * Obtenir le pourcentage de progression
   */
  get progressPercentage(): number {
    if (this.tasks.length === 0) return 0;
    return Math.round((this.taskStats.completed / this.tasks.length) * 100);
  }

  /**
   * Obtenir la classe de priorité
   */
  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'urgente': 'bg-red-100 text-red-800 border-red-200',
      'haute': 'bg-orange-100 text-orange-800 border-orange-200',
      'moyenne': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'basse': 'bg-green-100 text-green-800 border-green-200'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  }

  /**
   * Obtenir le label de priorité
   */
  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'urgente': 'Urgente',
      'haute': 'Haute',
      'moyenne': 'Moyenne',
      'basse': 'Basse'
    };
    return labels[priority] || priority;
  }

  /**
   * Obtenir le label de statut
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminée'
    };
    return labels[status] || status;
  }

  /**
   * Formater la taille d'un fichier
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math. floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Obtenir l'icône pour un type de fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName?. split('.').pop()?.toLowerCase();
    const iconMap: Record<string, string> = {
      'pdf': 'fa-file-pdf text-red-600',
      'doc': 'fa-file-word text-blue-600',
      'docx': 'fa-file-word text-blue-600',
      'xls': 'fa-file-excel text-green-600',
      'xlsx': 'fa-file-excel text-green-600',
      'zip': 'fa-file-archive text-yellow-600',
      'rar': 'fa-file-archive text-yellow-600',
      'jpg': 'fa-file-image text-purple-600',
      'jpeg': 'fa-file-image text-purple-600',
      'png': 'fa-file-image text-purple-600'
    };
    return iconMap[extension || ''] || 'fa-file text-gray-600';
  }

  /**
   * Formater une date
   */
  formatDate(date: string | null | undefined): string {
    if (! date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Formater un montant
   */
  formatAmount(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null) return 'N/A';
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return 'N/A';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
  }

  /**
   * Retourner à la liste des contrats
   */
  goBack(): void {
    this. router.navigate(['/freelance/contracts']);
  }

  /**
   * Effacer les messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * TrackBy pour les tâches
   */
  trackByTaskId(index: number, task: Task): number {
    return task.id || index;
  }

  /**
   * TrackBy pour les livrables
   */
  trackByDeliverableId(index: number, deliverable: Attachement): number {
    return deliverable.id || index;
  }
}
