import { Injectable } from '@angular/core';
import {catchError, Observable, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Attachement} from "../models/attachement";

@Injectable({
  providedIn: 'root'
})
export class AttachementService {

  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Ajouter des livrables à un projet (Freelance)
   */
  addProjectDeliverables(projectId: number, files: File[]): Observable<{ message: string; deliverables: Attachement[] }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('deliverables[]', file, file.name);
    });

    return this.http.post<{ message: string; deliverables: Attachement[] }>(
      `${this.apiUrl}/projects/${projectId}/deliverables`,
      formData
    ).pipe(catchError(this.handleError));
  }

  /**
   * Ajouter un lien comme livrable à un projet (Freelance)
   */
  addProjectDeliverableLink(projectId: number, name: string, url: string): Observable<{ message: string; deliverable: Attachement }> {
    return this.http.post<{ message: string; deliverable: Attachement }>(
      `${this.apiUrl}/projects/${projectId}/deliverables/link`,
      { name, url }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Ajouter des pièces jointes à un projet (Client)
   */
  addProjectAttachments(projectId: number, files: File[]): Observable<{ message: string; attachments: Attachement[] }> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('attachments[]', file, file.name);
    });

    return this.http.post<{ message: string; attachments: Attachement[] }>(
      `${this.apiUrl}/projects/${projectId}/attachments`,
      formData
    ).pipe(catchError(this.handleError));
  }

  /**
   * Ajouter un lien à un projet (Client)
   */
  addProjectLink(projectId: number, name: string, url: string): Observable<{ message: string; attachment: Attachement }> {
    return this.http.post<{ message: string; attachment: Attachement }>(
      `${this.apiUrl}/projects/${projectId}/attachments/link`,
      { name, url }
    ).pipe(catchError(this.handleError));
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else {
        errorMessage = `Code d'erreur: ${error.status}, Message: ${error.message}`;
      }
    }

    return throwError(() => new Error(errorMessage));
  }
}
