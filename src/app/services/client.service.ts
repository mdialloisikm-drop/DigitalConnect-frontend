import { Injectable } from '@angular/core';
import {catchError, forkJoin, map, Observable, of, switchMap, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {ClientDashboardStats} from "../models/client";
import {Project} from "../models/project";
import {Proposal} from "../models/proposal";

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}


  /**
   * Récupérer tous les projets du client
   */
  getMyProjects(page: number = 1, perPage: number = 10): Observable<PaginatedResponse<Project>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<PaginatedResponse<Project>>(`${this.apiUrl}/projects/my/list`, { params })
      .pipe(catchError(this.handleError));
  }


  /**
   * Récupérer un projet spécifique
   */
  getProjectById(id: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Créer un nouveau projet
   */
  createProject(projectData: FormData): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, projectData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Mettre à jour un projet
   */
  updateProject(id: number, projectData: FormData): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects/${id}`, projectData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Supprimer un projet
   */
  deleteProject(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/projects/${id}`)
      .pipe(catchError(this.handleError));
  }



  /**
   * Accepter une candidature
   */
  acceptProposal(proposalId: number): Observable<{ message: string; contract: unknown }> {
    return this.http.post<{ message: string; contract: unknown }>(
      `${this.apiUrl}/proposals/${proposalId}/accept`,
      {}
    ).pipe(catchError(this.handleError));
  }

  /**
   * Rejeter une candidature
   */
  rejectProposal(proposalId: number, reason?: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/proposals/${proposalId}/reject`,
      { reason }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Gestion centralisée des erreurs
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'Impossible de contacter le serveur';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.statusText}`;
      }
    }

    console.error('Erreur HTTP:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }


  /**
   * Récupère tous les projets du client (pour dashboard, non paginé)
   */
  getAllMyProjects(): Observable<Project[]> {
    const params = new HttpParams().set('per_page', '1000');
    return this.http.get<any>(`${this.apiUrl}/projects/my/list`, { params })
      .pipe(
        map(response => {
          console.log('🔍 Réponse brute de l\'API /projects/my/list:', response);

          // Vérifier si la réponse est paginée ou directe
          if (Array.isArray(response)) {
            console.log('✅ Réponse directe (tableau):', response.length, 'projets');
            return response;
          } else if (response && response.data && Array.isArray(response.data)) {
            console.log('✅ Réponse paginée:', response.data.length, 'projets');
            return response.data;
          } else {
            console.warn('⚠️ Structure de réponse inattendue:', response);
            return [];
          }
        }),
        catchError(error => {
          console.error('❌ Erreur lors de la récupération des projets:', error);
          return of([]); // Retourner un tableau vide en cas d'erreur
        })
      );
  }

  /**
   * Récupère toutes les propositions pour tous les projets du client
   * MÉTHODE CORRIGÉE avec switchMap pour aplatir les observables
   */
  private getAllMyProposals(): Observable<Proposal[]> {
    return this.getAllMyProjects().pipe(
      switchMap(projects => {
        console.log('🔍 Projets récupérés pour les propositions:', projects);

        // Si aucun projet, retourner un observable avec tableau vide
        if (!projects || projects.length === 0) {
          console.log('⚠️ Aucun projet trouvé, pas de propositions à récupérer');
          return of([]);
        }

        // Créer un observable pour chaque projet afin de récupérer ses propositions
        const proposalRequests = projects.map(project => {
          console.log(`📤 Récupération des propositions pour le projet ID: ${project.id}`);
          return this.http.get<any>(`${this.apiUrl}/projects/${project.id}/proposals`)
            .pipe(
              map(response => {
                console.log(`📥 Réponse propositions pour projet ${project.id}:`, response);
                // Vérifier si la réponse est un tableau ou un objet avec data
                if (Array.isArray(response)) {
                  return response;
                } else if (response && response.data && Array.isArray(response.data)) {
                  return response.data;
                } else {
                  console.warn(`⚠️ Structure inattendue pour projet ${project.id}:`, response);
                  return [];
                }
              }),
              catchError(error => {
                console.warn(`❌ Erreur lors de la récupération des propositions pour le projet ${project.id}:`, error);
                return of([]); // En cas d'erreur, retourner un tableau vide
              })
            );
        });

        // Combiner toutes les requêtes avec forkJoin
        return forkJoin(proposalRequests).pipe(
          map(proposalsArrays => {
            const flattened = proposalsArrays.flat();
            console.log('✅ Total propositions récupérées:', flattened.length);
            return flattened;
          }),
          catchError(error => {
            console.error('❌ Erreur lors de la récupération des propositions:', error);
            return of([]);
          })
        );
      }),
      catchError(error => {
        console.error('❌ Erreur globale getAllMyProposals:', error);
        return of([]); // En cas d'erreur globale, retourner un tableau vide
      })
    );
  }

  /**
   * Récupérer les statistiques du dashboard (Calculé côté client)
   * MÉTHODE CORRIGÉE avec gestion d'erreur améliorée et logs
   */
  getDashboardStats(): Observable<ClientDashboardStats> {
    return this.http.get<ClientDashboardStats>(`${this.apiUrl}/client/dashboard/stats`)
      .pipe(
        catchError(error => {
          console.error('❌ Erreur lors de la récupération des statistiques:', error);
          // Retourner des statistiques vides en cas d'erreur
          return of({
            total_projects: 0,
            active_projects: 0,
            completed_projects: 0,
            total_spent: 0,
            total_proposals: 0,
            pending_proposals: 0,
            accepted_proposals: 0,
            rejected_proposals: 0
          });
        })
      );
  }

  /**
   * Récupérer les candidatures (proposals) pour un projet spécifique du client
   */
  getMyProposals(projectId: number): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/projects/${projectId}/proposals`)
      .pipe(catchError(this.handleError));
  }
}
