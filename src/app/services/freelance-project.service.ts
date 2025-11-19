import { Injectable } from '@angular/core';
import {Contract} from "../models/contract";
import {Project} from "../models/project";
import {environment} from "../../environments/environment";
import {BehaviorSubject, catchError, map, Observable, tap, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse, HttpHeaders} from "@angular/common/http";
import {Attachement} from "../models/attachement";

/**
 * Interface pour un projet avec son contrat
 */
export interface ProjectWithContract {
  project: Project;
  contract: Contract;
}

@Injectable({
  providedIn: 'root'
})
export class FreelanceProjectService {
  private readonly apiUrl = `${environment.apiUrl}`;
  private projectsSubject = new BehaviorSubject<ProjectWithContract[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  /**
   * Récupère les en-têtes HTTP avec le token d'authentification
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      errorMessage = error.error?.error || error.error?.message || errorMessage;
    }

    console.error('Erreur HTTP:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Récupère tous les projets où le freelance a été embauché (via les contrats)
   */
  getMyProjects(): Observable<ProjectWithContract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/contracts/my-contracts`, {
      headers: this.getHeaders()
    }).pipe(
      map((contracts: Contract[]) => {
        // Transformer les contrats en ProjectWithContract
        return contracts.map((contract: Contract) => ({
          project: contract.project!,
          contract: contract
        }));
      }),
      tap((projects: ProjectWithContract[]) => {
        this.projectsSubject.next(projects);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Récupère un projet spécifique par son ID via le contrat
   */
  getProject(projectId: number): Observable<ProjectWithContract> {
    return this.http.get<Contract[]>(`${this.apiUrl}/contracts/my-contracts`, {
      headers: this.getHeaders()
    }).pipe(
      map((contracts: Contract[]) => {
        const contract = contracts.find((c: Contract) => c.project_id === projectId);
        if (!contract || !contract.project) {
          throw new Error('Projet non trouvé');
        }
        return {
          project: contract.project,
          contract: contract
        };
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute des livrables à un projet (fichiers)
   */
  addDeliverables(projectId: number, files: File[]): Observable<{ message: string; attachments: Attachement[] }> {
    const formData = new FormData();
    files.forEach((file: File) => {
      formData.append('deliverables[]', file, file.name);
    });

    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<{ message: string; attachments: Attachement[] }>(
      `${this.apiUrl}/projects/${projectId}/deliverables`,
      formData,
      { headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Ajoute un lien comme livrable à un projet
   */
  addDeliverableLink(projectId: number, name: string, url: string): Observable<{ message: string; attachment: Attachement }> {
    return this.http.post<{ message: string; attachment: Attachement }>(
      `${this.apiUrl}/projects/${projectId}/deliverables/link`,
      { name, url },
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Supprime un livrable
   */
  deleteAttachment(attachmentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/attachments/${attachmentId}`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Filtre les projets par statut de contrat
   */
  filterProjectsByStatus(projects: ProjectWithContract[], status: string): ProjectWithContract[] {
    if (status === 'all') {
      return projects;
    }
    return projects.filter((p: ProjectWithContract) => p.contract.status === status);
  }

  /**
   * Calcule le nombre de jours restants pour un projet
   */
  getDaysRemaining(contract: Contract): number {
    if (!contract.end_date || contract.status !== 'active') {
      return 0;
    }
    const endDate = new Date(contract.end_date);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Calcule le pourcentage de progression d'un projet
   */
  getProjectProgress(contract: Contract): number {
    if (!contract.start_date || !contract.end_date) {
      return 0;
    }
    const startDate = new Date(contract.start_date);
    const endDate = new Date(contract.end_date);
    const today = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();

    const progress = (elapsed / totalDuration) * 100;
    return Math.min(100, Math.max(0, progress));
  }

  /**
   * Télécharge un livrable
   */
  downloadAttachment(attachment: Attachement): string {
    if (attachment.format === 'link' && attachment.url) {
      return attachment.url;
    }
    if (attachment.file_path) {
      return `${environment.apiUrl.replace('/api', '')}/storage/${attachment.file_path}`;
    }
    return '';
  }

  /**
   * Rafraîchit la liste des projets
   */
  refreshProjects(): void {
    this.getMyProjects().subscribe({
      next: () => {
        console.log('Projets rafraîchis avec succès');
      },
      error: (error: Error) => {
        console.error('Erreur lors du rafraîchissement des projets:', error);
      }
    });
  }
}
