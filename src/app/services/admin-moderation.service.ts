import { Injectable } from '@angular/core';
import {Project} from "../models/project";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient} from "@angular/common/http";
import {Service} from "../models/service";
import {PaginatedResponse} from "../models/paginated-response";
import {map} from "rxjs/operators";

export interface ModerationResponse {
  message: string;
  project: Project;
}

export interface ServiceModerationResponse {
  message: string;
  service: Service;
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

  // ==================== SERVICES ====================

  /**
   * Récupérer les services en attente de modération
   */
  getPendingServices(): Observable<Service[]> {
    return this.http.get<PaginatedResponse<Service> | Service[]>(`${this. apiUrl}/admin/services/pending`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        return response.data || [];
      })
    );
  }

  /**
   * Approuver un service
   */
  approveService(serviceId: number): Observable<ServiceModerationResponse> {
    return this.http.post<ServiceModerationResponse>(
      `${this.apiUrl}/admin/services/${serviceId}/approve`,
      {}
    );
  }

  /**
   * Rejeter un service
   */
  rejectService(serviceId: number, reason?: string): Observable<ServiceModerationResponse> {
    return this.http.post<ServiceModerationResponse>(
      `${this.apiUrl}/admin/services/${serviceId}/reject`,
      { reason }
    );
  }

  /**
   * Récupérer les détails d'un service
   */
  getServiceDetails(serviceId: number): Observable<Service> {
    return this. http.get<Service>(`${this.apiUrl}/services/${serviceId}`);
  }
}
