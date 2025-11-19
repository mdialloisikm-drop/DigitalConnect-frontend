import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {catchError, forkJoin, map, Observable, throwError} from 'rxjs';
import { environment } from '../../environments/environment';
import { Service } from '../models/service';
import { Category } from '../models/category';
import {Order} from "../models/order";
import {Proposal} from "../models/proposal";
import {AuthService} from "./auth.service";

/**
 * Interface pour les statistiques du dashboard freelance
 */
export interface FreelanceDashboardStats {
  total_services: number;
  total_orders: number;
  active_orders: number;
  completed_orders: number;
  total_contracts: number;
  active_contracts: number;
  total_earnings: number;
  pending_earnings: number;
}

/**
 * Service pour gérer les opérations liées au freelance
 */
@Injectable({
  providedIn: 'root'
})
export class FreelanceService {
  private readonly apiUrl = `${environment.apiUrl}`;

  constructor(private readonly http: HttpClient, private readonly authService: AuthService) {}

  /**
   * Récupère les statistiques du dashboard
   */
  getDashboardStats(): Observable<FreelanceDashboardStats> {
    // Vérification de l'autorisation
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || currentUser.user_type !== 'freelance') {
      return throwError(() => new Error('Utilisateur non autorisé'));
    }

    // Récupération parallèle de toutes les données nécessaires
    return forkJoin({
      services: this.getMyServices(),
      orders: this.getMyOrders(),
      proposals: this.getMyProposals()
    }).pipe(
      map(data => {
        // Calcul des statistiques côté frontend

        // Statistiques des commandes
        const activeOrders = data.orders.filter(order =>
          order.status === 'pending' || order.status === 'in_progress'
        ).length;

        const completedOrders = data.orders.filter(order =>
          order.status === 'completed'
        ).length;

        // Les contrats = propositions acceptées
        const acceptedProposals = data.proposals.filter(proposal =>
          proposal.status === 'accepted'
        );
        const totalContracts = acceptedProposals.length;

        // Contrats actifs = propositions acceptées
        // Pour simplifier, on considère tous les contrats comme actifs
        const activeContracts = totalContracts;

        // Calcul des gains
        // Gains totaux = commandes complétées
        const totalEarnings = data.orders
          .filter(order => order.status === 'completed')
          .reduce((sum, order) => sum + Number(order.amount), 0);

        // Gains en attente = commandes en cours ou livrées
        const pendingEarnings = data.orders
          .filter(order =>
            order.status === 'in_progress' || order.status === 'delivered'
          )
          .reduce((sum, order) => sum + Number(order.amount), 0);

        return {
          total_services: data.services.length,
          total_orders: data.orders.length,
          active_orders: activeOrders,
          completed_orders: completedOrders,
          total_contracts: totalContracts,
          active_contracts: activeContracts,
          total_earnings: totalEarnings,
          pending_earnings: pendingEarnings
        };
      })
    );
  }

  /**
   * Récupère tous les services du freelance connecté
   */
  getMyServices(): Observable<Service[]> {
    return this.http.get<Service[]>(`${this.apiUrl}/services/my/list`);
  }

  /**
   * Récupère toutes les catégories disponibles
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/categories`);
  }

  /**
   * Crée un nouveau service avec images
   * Les images sont incluses dans le FormData
   */
  createService(formData: FormData): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services`, formData);
  }

  /**
   * Récupère toutes les commandes du freelance connecté
   */
  getMyOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/orders/my/list`);
  }

  /**
   * Récupère toutes les propositions du freelance connecté
   */
  getMyProposals(): Observable<Proposal[]> {
    return this.http.get<Proposal[]>(`${this.apiUrl}/proposals/my/list`);
  }

  /**
   * Met à jour un service existant (sans modifier les images)
   * Pour ajouter/supprimer des images, utiliser addServiceImages et deleteServiceImage
   */
  updateService(id: number, formData: FormData): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services/${id}?_method=PUT`, formData);
  }

  /**
   * Supprime un service (les images sont automatiquement supprimées par le backend)
   */
  deleteService(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/services/${id}`);
  }

  /**
   * Ajoute des images à un service existant
   */
  addServiceImages(serviceId: number, formData: FormData): Observable<Service> {
    return this.http.post<Service>(`${this.apiUrl}/services/${serviceId}/images`, formData);
  }

  /**
   * Supprime une image d'un service
   */
  deleteServiceImage(serviceId: number, imageId: number): Observable<Service> {
    return this.http.delete<Service>(`${this.apiUrl}/services/${serviceId}/images/${imageId}`);
  }
}
