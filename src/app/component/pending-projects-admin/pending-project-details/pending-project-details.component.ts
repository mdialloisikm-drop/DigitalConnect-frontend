import {Component, OnInit} from '@angular/core';
import {Project} from "../../../models/project";
import {ActivatedRoute, Router} from "@angular/router";
import {AdminModerationService} from "../../../services/admin-moderation.service";
import {TaskService} from "../../../services/task.service";
import { Task } from '../../../models/task';

@Component({
  selector: 'app-pending-project-details',
  templateUrl: './pending-project-details.component.html',
  styleUrl: './pending-project-details.component.css'
})
export class PendingProjectDetailsComponent implements OnInit {
  project: Project | null = null;
  tasks: Task[] = [];
  loading = false;
  tasksLoading = false;
  error = false;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private moderationService: AdminModerationService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    const projectId = this.route.snapshot.params['id'];
    if (projectId) {
      this.loadProjectDetails(+projectId);
    }
  }

  loadProjectDetails(projectId: number): void {
    this.loading = true;
    this.error = false;

    this.moderationService.getProjectDetails(projectId).subscribe({
      next: (project) => {
        this.project = project;
        this.loading = false;

        // Charger les tâches si elles existent
        if (project.id) {
          this.loadProjectTasks(project.id);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement du projet:', error);
        this.error = true;
        this.errorMessage = 'Impossible de charger les détails du projet';
        this.loading = false;
      }
    });
  }

  loadProjectTasks(projectId: number): void {
    this.tasksLoading = true;

    this.taskService.getProjectPendingTasks(projectId).subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.tasksLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des tâches:', error);
        this.tasksLoading = false;
      }
    });
  }


  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'en_attente': 'En attente',
      'open': 'Ouvert',
      'in_progress': 'En cours',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'archived': 'Archivé'
    };
    return labels[status] || status;
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'en_attente': 'bg-yellow-100 text-yellow-800',
      'open': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'archived': 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'basse': 'Basse',
      'moyenne': 'Moyenne',
      'haute': 'Haute',
      'urgente': 'Urgente'
    };
    return labels[priority] || priority;
  }

  getPriorityClass(priority: string): string {
    const classes: Record<string, string> = {
      'basse': 'bg-gray-100 text-gray-700',
      'moyenne': 'bg-blue-100 text-blue-700',
      'haute': 'bg-orange-100 text-orange-700',
      'urgente': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }

  getTaskStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'completed': 'Terminée'
    };
    return labels[status] || status;
  }

  getTaskStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  goBack(): void {
    this.router.navigate(['/admin/projects/pending']);
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
