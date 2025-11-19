import { Component, OnDestroy, OnInit } from '@angular/core';
import { Contract } from "../../models/contract";
import { Project } from "../../models/project";
import { Attachement } from "../../models/attachement";
import { Task, TaskFormData } from "../../models/task";
import { Subject, takeUntil } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { ContractService } from "../../services/contract.service";
import { ClientService } from "../../services/client.service";
import { MessageHttpService } from "../../services/message-http.service";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../environments/environment";

interface TaskResponse {
  message: string;
  task: Task;
}

interface TaskDeleteResponse {
  message: string;
}

@Component({
  selector: 'app-client-manage-project',
  templateUrl: './client-manage-project.component.html',
  styleUrl: './client-manage-project.component.css'
})
export class ClientManageProjectComponent implements OnInit, OnDestroy {
  project: Project | null = null;
  contract: Contract | null = null;
  deliverables: Attachement[] = [];
  tasks: Task[] = [];

  activeTab: 'about' | 'tasks' | 'contract' | 'deliverables' = 'about';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Gestion du formulaire de tâche
  showTaskForm = false;
  isEditingTask = false;
  currentTaskId: number | null = null;
  taskForm: TaskFormData = {
    title: '',
    description: '',
    priority: 'moyenne'
  };

  // Exposer Math pour l'utiliser dans le template
  readonly Math = Math;

  private readonly destroy$ = new Subject<void>();
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly contractService: ContractService,
    private readonly clientService: ClientService,
    private readonly messageHttpService: MessageHttpService,
    private readonly http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadProjectData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les données du projet
   */
  private loadProjectData(): void {
    const projectId = this.route.snapshot.params['id'];
    if (!projectId) {
      this.router.navigate(['/client/projects']);
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.clientService.getProjectById(Number(projectId))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (project: Project) => {
          this.project = project;
          this.tasks = project.tasks || [];

          this.deliverables = project.attachments?.filter(
            attachment => attachment.file_type === 'deliverable'
          ) || [];

          this.loadContract();
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.errorMessage = error.message;
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger le contrat associé au projet
   */
  private loadContract(): void {
    this.contractService.getMyContracts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contracts: Contract[]) => {
          this.contract = contracts.find(c => c.project_id === this.project?.id) || null;
        },
        error: (error: Error) => {
          console.error('Erreur lors du chargement du contrat:', error);
        }
      });
  }

  /**
   * Vérifier si le projet a un freelance embauché
   */
  hasFreelance(): boolean {
    return !!this.contract?.freelance;
  }

  /**
   * Changer d'onglet
   */
  changeTab(tab: 'about' | 'tasks' | 'contract' | 'deliverables'): void {
    this.activeTab = tab;
    this.clearMessages();
    this.closeTaskForm();
  }

  /**
   * Ouvrir le formulaire de tâche pour ajout
   */
  openAddTaskForm(): void {
    this.isEditingTask = false;
    this.currentTaskId = null;
    this.taskForm = {
      title: '',
      description: '',
      priority: 'moyenne'
    };
    this.showTaskForm = true;
  }

  /**
   * Ouvrir le formulaire de tâche pour modification
   */
  openEditTaskForm(task: Task): void {
    this.isEditingTask = true;
    this.currentTaskId = task.id || null;
    this.taskForm = {
      title: task.title,
      description: task.description,
      priority: task.priority
    };
    this.showTaskForm = true;
  }

  /**
   * Fermer le formulaire de tâche
   */
  closeTaskForm(): void {
    this.showTaskForm = false;
    this.isEditingTask = false;
    this.currentTaskId = null;
    this.taskForm = {
      title: '',
      description: '',
      priority: 'moyenne'
    };
  }

  /**
   * Sauvegarder une tâche (ajout ou modification)
   */
  saveTask(): void {
    if (!this.taskForm.title.trim()) {
      this.errorMessage = 'Le titre de la tâche est requis.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    if (this.isEditingTask) {
      this.http.put<TaskResponse>(`${this.apiUrl}/tasks/${this.currentTaskId}`, this.taskForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: TaskResponse) => {
            this.successMessage = 'Tâche modifiée avec succès';
            this.closeTaskForm();
            this.loadProjectData();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error: { error?: { error?: string } }) => {
            this.errorMessage = error.error?.error || 'Erreur lors de la sauvegarde de la tâche';
            this.isLoading = false;
          }
        });
    } else {
      this.http.post<TaskResponse>(`${this.apiUrl}/projects/${this.project?.id}/tasks`, this.taskForm)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: TaskResponse) => {
            this.successMessage = 'Tâche créée avec succès';
            this.closeTaskForm();
            this.loadProjectData();
            setTimeout(() => this.successMessage = '', 3000);
          },
          error: (error: { error?: { error?: string } }) => {
            this.errorMessage = error.error?.error || 'Erreur lors de la sauvegarde de la tâche';
            this.isLoading = false;
          }
        });
    }
  }

  /**
   * Supprimer une tâche
   */
  deleteTask(taskId: number): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.http.delete<TaskDeleteResponse>(`${this.apiUrl}/tasks/${taskId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.successMessage = 'Tâche supprimée avec succès';
          this.loadProjectData();
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error: { error?: { error?: string } }) => {
          this.errorMessage = error.error?.error || 'Erreur lors de la suppression de la tâche';
          this.isLoading = false;
        }
      });
  }

  /**
   * Obtenir le badge de priorité
   */
  getPriorityBadge(priority: string): { class: string; icon: string; label: string } {
    const badges: Record<string, { class: string; icon: string; label: string }> = {
      'basse': { class: 'bg-gray-100 text-gray-700', icon: 'fa-arrow-down', label: 'Basse' },
      'moyenne': { class: 'bg-blue-100 text-blue-700', icon: 'fa-minus', label: 'Moyenne' },
      'haute': { class: 'bg-orange-100 text-orange-700', icon: 'fa-arrow-up', label: 'Haute' },
      'urgente': { class: 'bg-red-100 text-red-700', icon: 'fa-exclamation', label: 'Urgente' }
    };
    return badges[priority] || badges['moyenne'];
  }

  /**
   * Retourner à la liste des projets
   */
  goBack(): void {
    this.router.navigate(['/client/projects']);
  }

  /**
   * Obtenir l'avatar du freelance
   */
  getFreelanceAvatar(): string {
    if (this.contract?.freelance?.user?.avatar) {
      const avatar = this.contract.freelance.user.avatar;
      if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
        return avatar;
      }
      return `http://localhost:8000/storage/avatars/${avatar}`;
    }

    const name = this.contract?.freelance?.user?.full_name || 'Freelance';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  /**
   * Gérer l'erreur de chargement d'image
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const name = this.contract?.freelance?.user?.full_name || 'Freelance';
    imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  /**
   * Ouvrir la messagerie avec le freelance
   */
  openMessaging(): void {
    if (!this.contract?.freelance?.id) {
      this.errorMessage = 'Aucun freelance n\'est associé à ce projet.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.messageHttpService.getConversations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (conversations) => {
          const existingConversation = conversations.find(
            conv => conv.freelance_id === this.contract?.freelance?.id
          );

          if (existingConversation) {
            this.router.navigate(['/messages', existingConversation.id]);
          } else {
            this.createConversation();
          }

          this.isLoading = false;
        },
        error: (error: Error) => {
          console.error('Erreur lors de l\'ouverture de la messagerie:', error);
          this.errorMessage = 'Impossible d\'ouvrir la conversation.';
          this.isLoading = false;
        }
      });
  }

  /**
   * Créer une nouvelle conversation
   */
  private createConversation(): void {
    if (!this.contract?.freelance?.user?.id) {
      this.errorMessage = 'Informations du freelance introuvables.';
      return;
    }

    const payload = {
      user_type: 'freelance',
      user_id: this.contract.freelance.user.id
    };

    this.messageHttpService.startConversation(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { conversation?: { id: number } }) => {
          if (response.conversation) {
            this.router.navigate(['/messages', response.conversation.id]);
          }
        },
        error: (error: Error) => {
          console.error('Erreur lors de la création de la conversation:', error);
          this.errorMessage = 'Impossible de créer la conversation.';
        }
      });
  }

  /**
   * Initier un appel
   */
  initiateCall(): void {
    console.log('Initier un appel avec le freelance');
  }

  /**
   * Obtenir l'icône pour un type de fichier
   */
  getFileIcon(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
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
      'png': 'fa-file-image text-purple-600',
      'psd': 'fa-file-image text-blue-600',
      'ai': 'fa-file-image text-orange-600',
      'fig': 'fa-file-code text-purple-600'
    };
    return iconMap[extension || ''] || 'fa-file text-gray-600';
  }

  /**
   * Formater une date
   */
  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Formater un montant
   */
  formatAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(numAmount);
  }

  /**
   * Obtenir le nombre de fichiers
   */
  getFilesCount(): number {
    return this.deliverables.filter(d => d.format === 'file').length;
  }

  /**
   * Obtenir le nombre de liens
   */
  getLinksCount(): number {
    return this.deliverables.filter(d => d.format === 'link').length;
  }

  /**
   * Effacer les messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Formater le tarif horaire du freelance
   */
  getFreelanceHourlyRate(): string {
    const hourlyRate = this.contract?.freelance?.hourly_rate;
    if (hourlyRate !== null && hourlyRate !== undefined) {
      return this.formatAmount(hourlyRate) + '/h';
    }
    return 'Non spécifié';
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
}
