import { Injectable } from '@angular/core';
import {environment} from "../../environments/environment";
import {BehaviorSubject, catchError, Observable, tap, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Order} from "../models/order";

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private readonly apiUrl = `${environment.apiUrl}/orders`;

  // Cache des commandes pour optimisation
  private ordersCache$ = new BehaviorSubject<Order[]>([]);

  // État de chargement
  private loadingSubject$ = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Crée une nouvelle commande pour un service
   */
  createOrder(serviceOfferId: number, requirements: string, attachments: File[]): Observable<{ message: string; order: Order }> {
    const formData = new FormData();
    formData.append('service_offer_id', serviceOfferId.toString());

    if (requirements && requirements.trim()) {
      formData.append('requirements', requirements. trim());
    }

    // Ajouter les fichiers joints (max 5)
    if (attachments && attachments.length > 0) {
      attachments.slice(0, 5).forEach((file: File) => {
        formData.append('attachments[]', file, file.name);
      });
    }

    this.loadingSubject$.next(true);

    return this. http.post<{ message: string; order: Order }>(this.apiUrl, formData). pipe(
      tap(() => {
        this.invalidateCache();
        this.loadingSubject$.next(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSubject$.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Récupère toutes mes commandes (client ou freelance)
   * Utilise un cache pour optimiser les performances
   */
  getMyOrders(forceRefresh: boolean = false): Observable<Order[]> {
    // Si on a déjà des données en cache et qu'on ne force pas le refresh
    if (this.ordersCache$.value.length > 0 && !forceRefresh) {
      return this.ordersCache$.asObservable();
    }

    this.loadingSubject$.next(true);

    return this.http.get<Order[]>(`${this.apiUrl}/my/list`).pipe(
      tap((orders: Order[]) => {
        this.ordersCache$.next(orders);
        this.loadingSubject$.next(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSubject$.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Récupère une commande spécifique par son ID
   */
  getOrderById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Annule une commande
   */
  cancelOrder(id: number): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(
      `${this.apiUrl}/${id}/cancel`,
      {}
    ).pipe(
      tap(() => {
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Accepter une commande (freelance - start)
   */
  acceptOrder(id: number): Observable<{ message: string; order: Order }> {
    return this.http.post<{ message: string; order: Order }>(
      `${this.apiUrl}/${id}/start`,
      {}
    ).pipe(
      tap(() => {
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Livrer une commande (freelance)
   */
  deliverOrder(id: number): Observable<{ message: string; order: Order }> {
    return this.http.put<{ message: string; order: Order }>(
      `${this.apiUrl}/${id}/deliver`,
      {}
    ).pipe(
      tap(() => {
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Vérifie si une commande peut être annulée par le freelance
   */
  canCancelOrder(order: Order): boolean {
    return order.status === 'pending';
  }

  /**
   * Vérifie si une commande peut être acceptée
   */
  canAcceptOrder(order: Order): boolean {
    return order.status === 'pending';
  }

  /**
   * Obtient le libellé du statut en français
   */
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'En attente',
      'in_progress': 'En cours',
      'delivered': 'Livré',
      'completed': 'Terminé',
      'cancelled': 'Annulé',
      'revision': 'Révision'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtient les classes CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'delivered': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'revision': 'bg-orange-100 text-orange-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtient l'icône FontAwesome pour le statut
   */
  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      'pending': 'fa-clock',
      'in_progress': 'fa-spinner',
      'delivered': 'fa-box',
      'completed': 'fa-check-circle',
      'cancelled': 'fa-times-circle',
      'revision': 'fa-redo'
    };
    return statusIcons[status] || 'fa-question-circle';
  }

  /**
   * Filtre les commandes par statut
   */
  filterByStatus(orders: Order[], status: string): Order[] {
    if (status === 'all') {
      return orders;
    }
    return orders.filter(o => o.status === status);
  }

  /**
   * Trie les commandes par date (plus récentes en premier)
   */
  sortByDate(orders: Order[], order: 'asc' | 'desc' = 'desc'): Order[] {
    return [...orders].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Calcule des statistiques sur les commandes
   */
  getOrderStats(orders: Order[]): {
    total: number;
    pending: number;
    in_progress: number;
    delivered: number;
    completed: number;
  } {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const in_progress = orders.filter(o => o.status === 'in_progress').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const completed = orders.filter(o => o.status === 'completed').length;

    return {
      total,
      pending,
      in_progress,
      delivered,
      completed
    };
  }

  /**
   * Invalide le cache des commandes
   */
  private invalidateCache(): void {
    this.ordersCache$.next([]);
  }

  /**
   * Gestion centralisée des erreurs HTTP
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
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }

    console.error('Erreur OrderService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Upload un livrable (freelance)
   */
  uploadDeliverable(orderId: number, file: File): Observable<{ message: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', 'deliverable');

    return this.http.post<{ message: string }>(
      `${environment.apiUrl}/attachments`,
      formData,
      {
        params: {
          attachable_type: 'Order',
          attachable_id: orderId.toString()
        }
      }
    );
  }

  /**
   * Supprimer un livrable
   */
  deleteDeliverable(attachmentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(
      `${environment.apiUrl}/attachments/${attachmentId}`
    );
  }

  /**
   * Accepter la livraison (client)
   */
  acceptDelivery(id: number): Observable<{ message: string; order: Order }> {
    return this.http.put<{ message: string; order: Order }>(
      `${this.apiUrl}/${id}/accept`,
      {}
    ). pipe(
      tap(() => {
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Demander une révision (client)
   */
  requestRevision(id: number, revisionNotes: string): Observable<{ message: string; order: Order }> {
    return this. http.put<{ message: string; order: Order }>(
      `${this.apiUrl}/${id}/revision`,
      { revision_notes: revisionNotes }
    ).pipe(
      tap(() => {
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }
}
