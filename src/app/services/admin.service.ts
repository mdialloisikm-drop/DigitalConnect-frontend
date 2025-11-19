import { Injectable } from '@angular/core';
import {forkJoin, map, Observable} from "rxjs";
import {Category} from "../models/category";
import {User} from "../models/user";
import {Skill} from "../models/skill";
import {Service} from "../models/service";
import {Project} from "../models/project";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";

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

  // Dashboard - Utilise les APIs existantes pour récupérer les vraies données
  getDashboardStats(): Observable<DashboardStats> {
    return forkJoin({
      projects: this.http.get<Project[]>(`${this.apiUrl}/projects`),
      services: this.http.get<Service[]>(`${this.apiUrl}/services`),
      categories: this.http.get<Category[]>(`${this.apiUrl}/categories`),
      skills: this.http.get<Skill[]>(`${this.apiUrl}/skills`),
      users: this.http.get<User[]>(`${this.apiUrl}/users`),
      freelances: this.http.get<User[]>(`${this.apiUrl}/users/freelances/list`),
      clients: this.http.get<User[]>(`${this.apiUrl}/users/clients/list`)
    }).pipe(
      map(data => {
        const activeProjects = data.projects.filter(p =>
          p.status === 'open' || p.status === 'in_progress'
        ).length;

        const publishedServices = data.services.filter(s =>
          s.status === 'published'
        ).length;

        return {
          total_projects: data.projects.length,
          total_services: data.services.length,
          total_users: data.users.length,
          total_freelances: data.freelances.length,
          total_clients: data.clients.length,
          total_categories: data.categories.length,
          total_skills: data.skills.length,
          active_projects: activeProjects,
          published_services: publishedServices
        };
      })
    );
  }

  // Categories
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  getCategory(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/categories/${id}`);
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
    return this.http.post<Skill>(`${this.apiUrl}/skills`, data);
  }

  updateSkill(id: number, data: { name: string }): Observable<Skill> {
    return this.http.put<Skill>(`${this.apiUrl}/skills/${id}`, data);
  }

  deleteSkill(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/skills/${id}`);
  }
}
