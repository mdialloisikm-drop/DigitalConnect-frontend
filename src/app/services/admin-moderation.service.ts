import { Injectable } from '@angular/core';
import {Project} from "../models/project";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";

export interface ModerationResponse {
  message: string;
  project: Project;
}

@Injectable({
  providedIn: 'root'
})
export class AdminModerationService {

  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Récupérer les projets en attente de modération
   */
  getPendingProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/projects/pending`);
  }

  /**
   * Approuver un projet
   */
  approveProject(projectId: number): Observable<ModerationResponse> {
    return this.http.post<ModerationResponse>(
      `${this.apiUrl}/admin/projects/${projectId}/approve`,
      {}
    );
  }

  /**
   * Rejeter un projet
   */
  rejectProject(projectId: number, reason?: string): Observable<ModerationResponse> {
    return this.http.post<ModerationResponse>(
      `${this.apiUrl}/admin/projects/${projectId}/reject`,
      { reason }
    );
  }

  /**
   * Récupérer les détails d'un projet
   */
  getProjectDetails(projectId: number): Observable<Project> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${projectId}`);
  }
}
