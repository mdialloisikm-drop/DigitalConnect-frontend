import { Injectable } from '@angular/core';

import {environment} from "../../environments/environment";
import { catchError, Observable, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {Contract} from "../models/contract";

@Injectable({
  providedIn: 'root'
})
export class ContractService {
  private readonly apiUrl = `${environment.apiUrl}/contracts`;

  constructor(private http: HttpClient) {}

  /**
   * Récupérer mes contrats (client ou freelance)
   */
  getMyContracts(): Observable<Contract[]> {
    return this.http.get<Contract[]>(`${this.apiUrl}/my-contracts`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer un contrat spécifique
   */
  getContractById(id: number): Observable<Contract> {
    return this.http.get<Contract>(`${this.apiUrl}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Marquer un contrat comme complété (client uniquement)
   */
  completeContract(id: number): Observable<{ message: string; contract: Contract }> {
    return this.http.patch<{ message: string; contract: Contract }>(`${this.apiUrl}/${id}/complete`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Annuler un contrat
   */
  cancelContract(id: number, reason?: string): Observable<{ message: string; contract: Contract }> {
    return this.http.patch<{ message: string; contract: Contract }>(`${this.apiUrl}/${id}/cancel`, { reason })
      .pipe(catchError(this.handleError));
  }

  /**
   * Créer un litige pour un contrat
   */
  disputeContract(id: number, disputeReason: string): Observable<{ message: string; contract: Contract }> {
    return this.http.patch<{ message: string; contract: Contract }>(`${this.apiUrl}/${id}/dispute`, { dispute_reason: disputeReason })
      .pipe(catchError(this.handleError));
  }

  /**
   * Récupérer les statistiques des contrats
   */
  getStatistics(): Observable<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    disputed: number;
    total_amount: number;
    average_duration: number;
  }> {
    return this.http.get<{
      total: number;
      active: number;
      completed: number;
      cancelled: number;
      disputed: number;
      total_amount: number;
      average_duration: number;
    }>(`${this.apiUrl}/statistics`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Gestion des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
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
