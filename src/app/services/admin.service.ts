import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { Category } from "../models/category";
import { User } from "../models/user";
import { Skill } from "../models/skill";
import { Service } from "../models/service";
import { Project } from "../models/project";
import { environment } from "../../environments/environment";
import { PaginatedResponse } from "../models/paginated-response";

export interface DashboardStats {
  total_projects: number;
  total_services: number;
  total_users: number;
  total_freelances: number;
  total_clients: number;
  total_categories: number;
  total_skills: number;
  active_projects: number;
  published_services: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * ✅ SOLUTION 1 : Utiliser l'API backend optimisée (recommandé)
   * Si tu as créé l'endpoint /admin/dashboard/stats
   */
  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/admin/dashboard/stats`);
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this. http.get<Category>(`${this.apiUrl}/categories/${id}`);
  }

  createCategory(data: { name: string }): Observable<Category> {
    return this.http.post<Category>(`${this.apiUrl}/categories`, data);
  }

  updateCategory(id: number, data: { name: string }): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/categories/${id}`, data);
  }

  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/categories/${id}`);
  }

  // Skills
  getSkills(): Observable<Skill[]> {
    return this.http.get<Skill[]>(`${this.apiUrl}/skills`);
  }

  getSkill(id: number): Observable<Skill> {
    return this.http.get<Skill>(`${this.apiUrl}/skills/${id}`);
  }

  createSkill(data: { name: string }): Observable<Skill> {
    return this. http.post<Skill>(`${this.apiUrl}/skills`, data);
  }

  updateSkill(id: number, data: { name: string }): Observable<Skill> {
    return this.http.put<Skill>(`${this.apiUrl}/skills/${id}`, data);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http. delete<void>(`${this. apiUrl}/skills/${id}`);
  }
}
