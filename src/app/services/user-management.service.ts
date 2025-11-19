import { Injectable } from '@angular/core';
import {User} from "../models/user";
import {UserStats} from "../models/user-stats";
import {environment} from "../../environments/environment";
import {BehaviorSubject, map, Observable, tap} from "rxjs";
import {HttpClient} from "@angular/common/http";

interface UserFilters {
  userType?: 'admin' | 'client' | 'freelance';
  status?: 'active' | 'suspended' | 'inactive';
  searchTerm?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly apiUrl = `${environment.apiUrl}/users`;

  private usersSubject = new BehaviorSubject<User[]>([]);
  private loadingSubject = new BehaviorSubject<boolean>(false);

  public users$ = this.usersSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les utilisateurs
   */
  getAllUsers(): Observable<User[]> {
    this.loadingSubject.next(true);

    return this.http.get<User[]>(this.apiUrl).pipe(
      tap(users => {
        this.usersSubject.next(users);
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Récupère un utilisateur par son ID
   */
  getUserById(userId: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Récupère les freelances actifs
   */
  getFreelances(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/freelances/list`);
  }

  /**
   * Récupère les clients actifs
   */
  getClients(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/clients/list`);
  }

  /**
   * Met à jour le statut d'un utilisateur
   */
  updateUserStatus(userId: number, status: 'active' | 'suspended' | 'inactive'): Observable<User> {
    return this.http.put<{ message: string; user: User }>(
      `${this.apiUrl}/${userId}/status`,
      { status }
    ).pipe(
      map(response => response.user),
      tap(() => {
        // Mettre à jour la liste locale
        const currentUsers = this.usersSubject.value;
        const updatedUsers = currentUsers.map(user =>
          user.id === userId ? { ...user, status } : user
        );
        this.usersSubject.next(updatedUsers);
      })
    );
  }

  /**
   * Supprime un utilisateur
   */
  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`).pipe(
      tap(() => {
        // Retirer l'utilisateur de la liste locale
        const currentUsers = this.usersSubject.value;
        const filteredUsers = currentUsers.filter(user => user.id !== userId);
        this.usersSubject.next(filteredUsers);
      })
    );
  }

  /**
   * Filtre les utilisateurs localement
   */
  filterUsers(users: User[], filters: UserFilters): User[] {
    let filteredUsers = [...users];

    // Filtre par type d'utilisateur
    if (filters.userType) {
      filteredUsers = filteredUsers.filter(user => user.user_type === filters.userType);
    }

    // Filtre par statut
    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    // Filtre par terme de recherche
    if (filters.searchTerm && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      filteredUsers = filteredUsers.filter(user =>
        user.full_name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower) ||
        (user.phone && user.phone.toLowerCase().includes(searchLower))
      );
    }

    return filteredUsers;
  }

  /**
   * Calcule les statistiques des utilisateurs
   */
  calculateStats(users: User[]): UserStats {
    return {
      total: users.length,
      clients: users.filter(u => u.user_type === 'client').length,
      freelances: users.filter(u => u.user_type === 'freelance').length,
      admins: users.filter(u => u.user_type === 'admin').length,
      active: users.filter(u => u.status === 'active').length,
      suspended: users.filter(u => u.status === 'suspended').length,
      inactive: users.filter(u => u.status === 'inactive').length
    };
  }

  /**
   * Réinitialise les données
   */
  reset(): void {
    this.usersSubject.next([]);
    this.loadingSubject.next(false);
  }
}
