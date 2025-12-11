import { Injectable } from '@angular/core';
import {Service} from "../models/service";
import {Freelance} from "../models/freelance";
import {Skill} from "../models/skill";
import {Observable} from "rxjs";
import {environment} from "../../environments/environment";
import {HttpClient, HttpParams} from "@angular/common/http";

export interface FreelanceFilters {
  min_rate?: number;
  max_rate?: number;
  skills?: number[];
  city?: string;
  country?: string;
  availability?: 'available' | 'busy' | 'unavailable';
  min_experience?: number;
  order_by?: string;
  order_direction?: 'asc' | 'desc';
}

export interface PaginatedFreelances {
  data: Freelance[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface FreelanceProfile {
  freelance: Freelance;
  statistics: {
    completed_projects: number;
    active_projects: number;
    total_projects: number;
    success_rate: number;
  };
  services: Service[];
}

export interface AvailableFilters {
  skills: Skill[];
  cities: string[];
  countries: string[];
  rate_range: {
    min: number;
    max: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FreelanceProfileService {

  private readonly apiUrl = `${environment.apiUrl}/freelances`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer les freelances avec filtres et pagination
   */
  getFreelances(filters: FreelanceFilters = {}, page: number = 1, perPage: number = 10): Observable<PaginatedFreelances> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (filters.min_rate) {
      params = params.set('min_rate', filters.min_rate.toString());
    }
    if (filters.max_rate) {
      params = params.set('max_rate', filters.max_rate.toString());
    }
    if (filters.city) {
      params = params.set('city', filters.city);
    }
    if (filters.country) {
      params = params.set('country', filters.country);
    }
    if (filters.availability) {
      params = params.set('availability', filters.availability);
    }
    if (filters.min_experience) {
      params = params.set('min_experience', filters.min_experience.toString());
    }
    if (filters.order_by) {
      params = params.set('order_by', filters.order_by);
    }
    if (filters.order_direction) {
      params = params.set('order_direction', filters.order_direction);
    }
    if (filters.skills && filters.skills.length > 0) {
      filters.skills.forEach(skillId => {
        params = params.append('skills[]', skillId.toString());
      });
    }

    return this.http.get<PaginatedFreelances>(this.apiUrl, { params });
  }

  /**
   * Récupérer le profil détaillé d'un freelance
   */
  getFreelanceProfile(freelanceId: number): Observable<FreelanceProfile> {
    return this.http.get<FreelanceProfile>(`${this.apiUrl}/${freelanceId}`);
  }

  /**
   * Récupérer les filtres disponibles
   */
  getAvailableFilters(): Observable<AvailableFilters> {
    return this.http.get<AvailableFilters>(`${this.apiUrl}/filters/available`);
  }

  /**
   * Obtenir l'URL de l'avatar
   */
  getAvatarUrl(avatarPath: string | undefined): string {
    if (!avatarPath) {
      return 'https://ui-avatars.com/api/?name=User&background=4F46E5&color=fff&size=128';
    }
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      return avatarPath;
    }
    return `http://localhost:8000/storage/avatars/${avatarPath}`;
  }

  /**
   * Obtenir le libellé de disponibilité
   */
  getAvailabilityLabel(availability: string): string {
    const labels: Record<string, string> = {
      'available': 'Disponible',
      'busy': 'Occupé',
      'unavailable': 'Indisponible'
    };
    return labels[availability] || availability;
  }

  /**
   * Obtenir la classe CSS pour le badge de disponibilité
   */
  getAvailabilityClass(availability: string): string {
    const classes: Record<string, string> = {
      'available': 'bg-green-100 text-green-800',
      'busy': 'bg-yellow-100 text-yellow-800',
      'unavailable': 'bg-red-100 text-red-800'
    };
    return classes[availability] || 'bg-gray-100 text-gray-800';
  }
}
