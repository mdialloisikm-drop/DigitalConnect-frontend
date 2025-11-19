import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Task, TaskFormData, TaskStatistics } from '../models/task';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Récupérer toutes les tâches d'un projet
   */
  getProjectTasks(projectId: number): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/projects/${projectId}/tasks`);
  }

  /**
   * Récupérer les tâches triées par priorité
   */
  getTasksByPriority(projectId: number, direction: 'asc' | 'desc' = 'desc'): Observable<Task[]> {
    return this.http.get<Task[]>(
      `${this.apiUrl}/projects/${projectId}/tasks/by-priority?direction=${direction}`
    );
  }

  /**
   * Créer une nouvelle tâche
   */
  createTask(projectId: number, taskData: TaskFormData): Observable<{ message: string; task: Task }> {
    return this.http.post<{ message: string; task: Task }>(
      `${this.apiUrl}/projects/${projectId}/tasks`,
      taskData
    );
  }

  /**
   * Récupérer une tâche spécifique
   */
  getTask(taskId: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/tasks/${taskId}`);
  }

  /**
   * Mettre à jour une tâche
   */
  updateTask(taskId: number, taskData: TaskFormData): Observable<{ message: string; task: Task }> {
    return this.http.put<{ message: string; task: Task }>(
      `${this.apiUrl}/tasks/${taskId}`,
      taskData
    );
  }

  /**
   * Supprimer une tâche
   */
  deleteTask(taskId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tasks/${taskId}`);
  }

  /**
   * Marquer une tâche comme complétée
   */
  completeTask(taskId: number): Observable<{ message: string; task: Task; project_progress: number }> {
    return this.http.post<{ message: string; task: Task; project_progress: number }>(
      `${this.apiUrl}/tasks/${taskId}/complete`,
      {}
    );
  }

  /**
   * Changer le statut d'une tâche
   */
  changeTaskStatus(
    taskId: number,
    status: 'pending' | 'in_progress' | 'completed'
  ): Observable<{ message: string; task: Task; project_progress: number }> {
    return this.http.post<{ message: string; task: Task; project_progress: number }>(
      `${this.apiUrl}/tasks/${taskId}/status`,
      { status }
    );
  }

  /**
   * Changer la priorité d'une tâche
   */
  changeTaskPriority(
    taskId: number,
    priority: 'basse' | 'moyenne' | 'haute' | 'urgente'
  ): Observable<{ message: string; task: Task }> {
    return this.http.post<{ message: string; task: Task }>(
      `${this.apiUrl}/tasks/${taskId}/priority`,
      { priority }
    );
  }

  /**
   * Réorganiser les tâches
   */
  reorderTasks(projectId: number, taskIds: number[]): Observable<{ message: string; tasks: Task[] }> {
    return this.http.post<{ message: string; tasks: Task[] }>(
      `${this.apiUrl}/projects/${projectId}/tasks/reorder`,
      { task_ids: taskIds }
    );
  }

  /**
   * Obtenir les statistiques des tâches d'un projet
   */
  getTaskStatistics(projectId: number): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(
      `${this.apiUrl}/projects/${projectId}/tasks/statistics`
    );
  }

  /**
   * Filtrer les tâches par priorité
   */
  filterByPriority(tasks: Task[], priority: string): Task[] {
    if (priority === 'all') {
      return tasks;
    }
    return tasks.filter(t => t.priority === priority);
  }

  /**
   * Filtrer les tâches par statut
   */
  filterByStatus(tasks: Task[], status: string): Task[] {
    if (status === 'all') {
      return tasks;
    }
    return tasks.filter(t => t.status === status);
  }

  /**
   * Trier les tâches par ordre
   */
  sortByOrder(tasks: Task[]): Task[] {
    return [...tasks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  /**
   * Obtenir le libellé de la priorité
   */
  getPriorityLabel(priority: string): string {
    const labels: Record<string, string> = {
      'basse': 'Basse',
      'moyenne': 'Moyenne',
      'haute': 'Haute',
      'urgente': 'Urgente'
    };
    return labels[priority] || priority;
  }

  /**
   * Obtenir le libellé du statut
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
   * Obtenir la classe CSS pour le badge de priorité
   */
  getPriorityBadgeClass(priority: string): string {
    const classes: Record<string, string> = {
      'basse': 'bg-gray-100 text-gray-700',
      'moyenne': 'bg-blue-100 text-blue-700',
      'haute': 'bg-orange-100 text-orange-700',
      'urgente': 'bg-red-100 text-red-700'
    };
    return classes[priority] || 'bg-gray-100 text-gray-700';
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtenir l'icône pour une priorité
   */
  getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      'basse': 'fa-arrow-down',
      'moyenne': 'fa-minus',
      'haute': 'fa-arrow-up',
      'urgente': 'fa-exclamation'
    };
    return icons[priority] || 'fa-minus';
  }

  /**
   * Obtenir l'icône pour un statut
   */
  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'pending': 'fa-clock',
      'in_progress': 'fa-spinner',
      'completed': 'fa-check-circle'
    };
    return icons[status] || 'fa-question-circle';
  }
}
