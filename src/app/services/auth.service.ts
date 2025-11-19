import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {environment} from "../../environments/environment";
import {BehaviorSubject, catchError, finalize, Observable, tap, throwError} from "rxjs";
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {AuthResponse, LoginData} from "../models/auth";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly tokenKey = 'auth_token';
  private readonly userKey = 'current_user';
  private readonly expiresAtKey = 'token_expires_at';

  private currentUserSubject: BehaviorSubject<User | null>;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);

  public currentUser$: Observable<User | null>;
  public isLoading$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      this.getUserFromStorage()
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();

    // Vérifier l'expiration du token au démarrage
    this.checkTokenExpiration();
  }

  /**
   * Retourne l'utilisateur actuellement connecté
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Retourne le token d'authentification
   */
  public get token(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Vérifie si l'utilisateur est authentifié
   */
  public get isAuthenticated(): boolean {
    const hasToken = !!this.token;
    const hasUser = !!this.currentUserValue;
    const isNotExpired = !this.isTokenExpired();

    return hasToken && hasUser && isNotExpired;
  }

  /**
   * Vérifie si l'utilisateur est un administrateur
   */
  public get isAdmin(): boolean {
    return this.currentUserValue?.user_type === 'admin';
  }

  /**
   * Vérifie si l'utilisateur est un client
   */
  public get isClient(): boolean {
    return this.currentUserValue?.user_type === 'client';
  }

  /**
   * Vérifie si l'utilisateur est un freelance
   */
  public get isFreelance(): boolean {
    return this.currentUserValue?.user_type === 'freelance';
  }

  /**
   * Met à jour l'utilisateur courant
   */
  public updateCurrentUser(user: User): void {
    this.saveUserToStorage(user);
    this.currentUserSubject.next(user);
  }

  /**
   * Connexion de l'utilisateur
   */
  login(credentials: LoginData): Observable<AuthResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Déconnexion de l'utilisateur
   */
  logout(): Observable<any> {
    this.isLoadingSubject.next(true);

    return this.http.post(`${this.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => this.handleLogout()),
        catchError(error => {
          // Même en cas d'erreur, on déconnecte localement
          this.handleLogout();
          return throwError(() => error);
        }),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   */
  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap(user => {
          this.saveUserToStorage(user);
          this.currentUserSubject.next(user);
        }),
        catchError(error => this.handleError(error))
      );
  }

  /**
   * Rafraîchit le token d'authentification
   */
  refreshToken(): Observable<{ token: string; token_type: string; expires_in: number }> {
    return this.http.post<{ token: string; token_type: string; expires_in: number }>(
      `${this.apiUrl}/auth/refresh`,
      {}
    ).pipe(
      tap(response => {
        if (response.token) {
          this.saveTokenToStorage(response.token, response.expires_in);
        }
      }),
      catchError(error => this.handleError(error))
    );
  }

  /**
   * Force la déconnexion locale
   */
  forceLogout(): void {
    this.handleLogout();
    this.router.navigate(['/login']);
  }

  /**
   * Gère la réponse d'authentification
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.saveTokenToStorage(response.token, response.expires_in);
    this.saveUserToStorage(response.user);
    this.currentUserSubject.next(response.user);
  }

  /**
   * Gère la déconnexion
   */
  private handleLogout(): void {
    this.clearStorage();
    this.currentUserSubject.next(null);
  }

  /**
   * Sauvegarde le token dans le localStorage
   */
  private saveTokenToStorage(token: string, expiresIn: number): void {
    const expiresAt = Date.now() + (expiresIn * 1000);
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.expiresAtKey, expiresAt.toString());
  }

  /**
   * Sauvegarde l'utilisateur dans le localStorage
   */
  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * Récupère l'utilisateur depuis le localStorage
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch {
        this.clearStorage();
        return null;
      }
    }
    return null;
  }

  /**
   * Vérifie si le token a expiré
   */
  private isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem(this.expiresAtKey);
    if (!expiresAt) {
      return true;
    }
    return Date.now() >= parseInt(expiresAt, 10);
  }

  /**
   * Vérifie l'expiration du token
   */
  private checkTokenExpiration(): void {
    if (this.token && this.isTokenExpired()) {
      this.handleLogout();
    }
  }

  /**
   * Nettoie le localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.expiresAtKey);
  }

  /**
   * Gère les erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      if (error.status === 401) {
        errorMessage = 'Identifiants invalides';
        this.forceLogout();
      } else if (error.status === 403) {
        errorMessage = 'Accès refusé';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur';
      } else if (error.error?.error) {
        errorMessage = error.error.error;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      }
    }

    return throwError(() => ({
      error: errorMessage,
      status: error.status
    }));
  }
}
