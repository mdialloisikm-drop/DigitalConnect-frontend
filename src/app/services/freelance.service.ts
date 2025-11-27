import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Service } from '../models/service';
import { Category } from '../models/category';
import { Order } from '../models/order';
import { Proposal } from '../models/proposal';
import { Contract } from '../models/contract';
import { PaginatedResponse } from '../models/paginated-response';
import {
  FreelanceDashboardStats,
  FreelanceDashboardOverview,
  MonthlyEarning
} from '../models/freelance-dashboard-stats';

@Injectable({
  providedIn: 'root'
})
export class FreelanceService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient) {}

  // ==================== DASHBOARD ====================

  getDashboardStats(): Observable<FreelanceDashboardStats> {
    return this.http.get<FreelanceDashboardStats>(`${this.apiUrl}/freelance/dashboard/stats`);
  }

  getDashboardOverview(): Observable<FreelanceDashboardOverview> {
    return this.http.get<FreelanceDashboardOverview>(`${this.apiUrl}/freelance/dashboard/overview`);
  }

  getRecentServices(limit: number = 5): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/freelance/dashboard/recent-services?limit=${limit}`);
  }

  getRecentOrders(limit: number = 5): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/freelance/dashboard/recent-orders?limit=${limit}`);
  }

  getRecentProposals(limit: number = 5): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/freelance/dashboard/recent-proposals?limit=${limit}`);
  }

  getRecentContracts(limit: number = 5): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/freelance/dashboard/recent-contracts?limit=${limit}`);
  }

  getMonthlyEarnings(): Observable<MonthlyEarning[]> {
    return this.http.get<MonthlyEarning[]>(`${this.apiUrl}/freelance/dashboard/monthly-earnings`);
  }

  // ==================== SERVICES ====================

  /**
   * Récupère tous les services du freelance connecté
   * ✅ Le backend retourne une réponse paginée, on extrait le tableau 'data'
   */
  getMyServices(perPage: number = 50): Observable<Service[]> {
    return this.http.get<PaginatedResponse<Service>>(`${this.apiUrl}/services/my/list?per_page=${perPage}`)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Récupère les services avec pagination complète
   */
  getMyServicesPaginated(page: number = 1, perPage: number = 12): Observable<PaginatedResponse<Service>> {
    return this.http.get<PaginatedResponse<Service>>(`${this.apiUrl}/services/my/list?page=${page}&per_page=${perPage}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  createService(formData: FormData): Observable<Service> {
    return this.http.post<{ message: string; service: Service }>(`${this.apiUrl}/services`, formData)
      .pipe(
        map(response => response.service)
      );
  }

  updateService(id: number, formData: FormData): Observable<Service> {
    return this.http.post<{ message: string; service: Service }>(`${this.apiUrl}/services/${id}?_method=PUT`, formData)
      .pipe(
        map(response => response.service)
      );
  }

  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`);
  }

  addServiceImages(serviceId: number, formData: FormData): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services/${serviceId}/images`, formData);
  }

  deleteServiceImage(serviceId: number, imageId: number): Observable<Service> {
    return this.http.delete<Service>(`${this.apiUrl}/services/${serviceId}/images/${imageId}`);
  }

  // ==================== COMMANDES ====================

  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/my/list`);
  }

  // ==================== PROPOSITIONS ====================

  getMyProposals(): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/proposals/my/list`);
  }
}
