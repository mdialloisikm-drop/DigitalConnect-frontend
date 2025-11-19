import { Injectable } from '@angular/core';
import {BehaviorSubject, catchError, Observable, tap, throwError} from "rxjs";
import {environment} from "../../environments/environment";
import {Proposal, ProposalFormData, ProposalResponse} from "../models/proposal";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ProposalService {

  private readonly apiUrl = `${environment.apiUrl}/proposals`;

  // Cache des propositions pour optimisation
  private proposalsCache$ = new BehaviorSubject<Proposal[]>([]);

  // État de chargement
  private loadingSubject$ = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject$.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère toutes les propositions du freelance connecté
   * Utilise un cache pour optimiser les performances
   */
  getMyProposals(forceRefresh: boolean = false): Observable<Proposal[]> {
    // Si on a déjà des données en cache et qu'on ne force pas le refresh
    if (this.proposalsCache$.value.length > 0 && !forceRefresh) {
      return this.proposalsCache$.asObservable();
    }

    this.loadingSubject$.next(true);

    return this.http.get<Proposal[]>(`${this.apiUrl}/my/list`).pipe(
      tap((proposals: Proposal[]) => {
        this.proposalsCache$.next(proposals);
        this.loadingSubject$.next(false);
      }),
      catchError((error: HttpErrorResponse) => {
        this.loadingSubject$.next(false);
        return this.handleError(error);
      })
    );
  }

  /**
   * Récupère une proposition spécifique par son ID
   */
  getProposalById(id: number): Observable<Proposal> {
    return this.http.get<Proposal>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crée une nouvelle proposition
   */
  createProposal(formData: ProposalFormData): Observable<ProposalResponse> {
    return this.http.post<ProposalResponse>(this.apiUrl, formData).pipe(
      tap(() => {
        // Invalider le cache après création
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Met à jour une proposition existante
   * Seulement possible si le statut est 'pending'
   */
  updateProposal(id: number, formData: ProposalFormData): Observable<ProposalResponse> {
    return this.http.put<ProposalResponse>(`${this.apiUrl}/${id}`, formData).pipe(
      tap(() => {
        // Invalider le cache après modification
        this.invalidateCache();
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Annule/Supprime une proposition
   * Seulement possible si le statut est 'pending'
   */
  cancelProposal(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Mettre à jour le cache en supprimant la proposition
        const currentProposals = this.proposalsCache$.value;
        const updatedProposals = currentProposals.filter(p => p.id !== id);
        this.proposalsCache$.next(updatedProposals);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Vérifie si une proposition peut être annulée
   * Règle métier: seulement les propositions 'pending' peuvent être annulées
   */
  canCancelProposal(proposal: Proposal): boolean {
    return proposal.status === 'pending';
  }

  /**
   * Vérifie si une proposition peut être modifiée
   * Règle métier: seulement les propositions 'pending' peuvent être modifiées
   */
  canEditProposal(proposal: Proposal): boolean {
    return proposal.status === 'pending';
  }

  /**
   * Obtient le libellé du statut en français
   */
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      'pending': 'En attente',
      'accepted': 'Acceptée',
      'rejected': 'Rejetée'
    };
    return statusLabels[status] || status;
  }

  /**
   * Obtient les classes CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  /**
   * Obtient l'icône FontAwesome pour le statut
   */
  getStatusIcon(status: string): string {
    const statusIcons: Record<string, string> = {
      'pending': 'fa-clock',
      'accepted': 'fa-check-circle',
      'rejected': 'fa-times-circle'
    };
    return statusIcons[status] || 'fa-question-circle';
  }

  /**
   * Filtre les propositions par statut
   */
  filterByStatus(proposals: Proposal[], status: string): Proposal[] {
    if (status === 'all') {
      return proposals;
    }
    return proposals.filter(p => p.status === status);
  }

  /**
   * Trie les propositions par date (plus récentes en premier)
   */
  sortByDate(proposals: Proposal[], order: 'asc' | 'desc' = 'desc'): Proposal[] {
    return [...proposals].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }

  /**
   * Calcule des statistiques sur les propositions
   */
  getProposalStats(proposals: Proposal[]): {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    acceptanceRate: number;
  } {
    const total = proposals.length;
    const pending = proposals.filter(p => p.status === 'pending').length;
    const accepted = proposals.filter(p => p.status === 'accepted').length;
    const rejected = proposals.filter(p => p.status === 'rejected').length;
    const acceptanceRate = total > 0 ? (accepted / (accepted + rejected)) * 100 : 0;

    return {
      total,
      pending,
      accepted,
      rejected,
      acceptanceRate: Math.round(acceptanceRate)
    };
  }

  /**
   * Invalide le cache des propositions
   */
  private invalidateCache(): void {
    this.proposalsCache$.next([]);
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

    console.error('Erreur ProposalService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
