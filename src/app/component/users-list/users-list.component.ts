import {Component, OnDestroy, OnInit} from '@angular/core';
import {User} from "../../models/user";
import {debounceTime, distinctUntilChanged, Subject, takeUntil} from "rxjs";
import {UserStats} from "../../models/user-stats";
import {FormControl} from "@angular/forms";
import {UserManagementService} from "../../services/user-management.service";

type UserType = 'admin' | 'client' | 'freelance';
type UserStatus = 'active' | 'suspended' | 'inactive';

interface FilterOptions {
  userType: UserType | null;
  status: UserStatus | null;
}

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent implements OnInit, OnDestroy {
  // Données
  allUsers: User[] = [];
  filteredUsers: User[] = [];
  stats: UserStats = {
    total: 0,
    clients: 0,
    freelances: 0,
    admins: 0,
    active: 0,
    suspended: 0,
    inactive: 0
  };

  // États
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Filtres
  searchControl = new FormControl('');
  selectedUserType: UserType | null = null;
  selectedStatus: UserStatus | null = null;

  // Options pour les dropdowns
  userTypeOptions: Array<{ value: UserType | null; label: string }> = [
    { value: null, label: 'Tous les types' },
    { value: 'admin', label: 'Administrateurs' },
    { value: 'client', label: 'Clients' },
    { value: 'freelance', label: 'Freelances' }
  ];

  statusOptions: Array<{ value: UserStatus | null; label: string }> = [
    { value: null, label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'suspended', label: 'Suspendus' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  // Modal
  showConfirmModal = false;
  modalAction: 'suspend' | 'activate' | 'delete' | null = null;
  selectedUser: User | null = null;

  private destroy$ = new Subject<void>();

  constructor(private userManagementService: UserManagementService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.setupSearchListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.userManagementService.reset();
  }

  /**
   * Configure l'écoute de la recherche avec debounce
   */
  private setupSearchListener(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  /**
   * Charge tous les utilisateurs
   */
  loadUsers(): void {
    this.isLoading = true;
    this.clearMessages();

    this.userManagementService.getAllUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.allUsers = users;
          this.applyFilters();
          this.updateStats();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError('Erreur lors du chargement des utilisateurs', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Applique les filtres sur les utilisateurs
   */
  applyFilters(): void {
    this.filteredUsers = this.userManagementService.filterUsers(this.allUsers, {
      userType: this.selectedUserType || undefined,
      status: this.selectedStatus || undefined,
      searchTerm: this.searchControl.value || undefined
    });
  }

  /**
   * Met à jour les statistiques
   */
  private updateStats(): void {
    this.stats = this.userManagementService.calculateStats(this.allUsers);
  }

  /**
   * Change le filtre de type d'utilisateur
   */
  onUserTypeChange(userType: UserType | null): void {
    this.selectedUserType = userType;
    this.applyFilters();
  }

  /**
   * Change le filtre de statut
   */
  onStatusChange(status: UserStatus | null): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  /**
   * Réinitialise tous les filtres
   */
  resetFilters(): void {
    this.selectedUserType = null;
    this.selectedStatus = null;
    this.searchControl.setValue('');
    this.applyFilters();
  }

  /**
   * Ouvre le modal de confirmation
   */
  openConfirmModal(action: 'suspend' | 'activate' | 'delete', user: User): void {
    this.modalAction = action;
    this.selectedUser = user;
    this.showConfirmModal = true;
  }

  /**
   * Ferme le modal de confirmation
   */
  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.modalAction = null;
    this.selectedUser = null;
  }

  /**
   * Confirme l'action du modal
   */
  confirmModalAction(): void {
    if (!this.selectedUser || !this.modalAction) {
      return;
    }

    const userId = this.selectedUser.id;

    switch (this.modalAction) {
      case 'suspend':
        this.suspendUser(userId);
        break;
      case 'activate':
        this.activateUser(userId);
        break;
      case 'delete':
        this.deleteUser(userId);
        break;
    }

    this.closeConfirmModal();
  }

  /**
   * Suspend un utilisateur
   */
  private suspendUser(userId: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.userManagementService.updateUserStatus(userId, 'suspended')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Utilisateur suspendu avec succès');
          this.loadUsers();
        },
        error: (error) => {
          this.handleError('Erreur lors de la suspension', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Active un utilisateur
   */
  private activateUser(userId: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.userManagementService.updateUserStatus(userId, 'active')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Utilisateur activé avec succès');
          this.loadUsers();
        },
        error: (error) => {
          this.handleError('Erreur lors de l\'activation', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Supprime un utilisateur
   */
  private deleteUser(userId: number): void {
    this.isLoading = true;
    this.clearMessages();

    this.userManagementService.deleteUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showSuccess('Utilisateur supprimé avec succès');
          this.loadUsers();
        },
        error: (error) => {
          this.handleError('Erreur lors de la suppression', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Obtient la classe CSS pour le badge de type
   */
  getUserTypeBadgeClass(userType: string): string {
    const classes: Record<string, string> = {
      admin: 'badge-admin',
      client: 'badge-client',
      freelance: 'badge-freelance'
    };
    return classes[userType] || 'badge-default';
  }

  /**
   * Obtient la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'badge-success',
      suspended: 'badge-warning',
      inactive: 'badge-danger'
    };
    return classes[status] || 'badge-default';
  }

  /**
   * Obtient le label français du type d'utilisateur
   */
  getUserTypeLabel(userType: string): string {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      client: 'Client',
      freelance: 'Freelance'
    };
    return labels[userType] || userType;
  }

  /**
   * Obtient le label français du statut
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Actif',
      suspended: 'Suspendu',
      inactive: 'Inactif'
    };
    return labels[status] || status;
  }

  /**
   * Obtient le titre du modal
   */
  getModalTitle(): string {
    if (!this.modalAction) return '';

    const titles: Record<string, string> = {
      suspend: 'Suspendre l\'utilisateur',
      activate: 'Activer l\'utilisateur',
      delete: 'Supprimer l\'utilisateur'
    };
    return titles[this.modalAction] || '';
  }

  /**
   * Obtient le message du modal
   */
  getModalMessage(): string {
    if (!this.modalAction || !this.selectedUser) return '';

    const messages: Record<string, string> = {
      suspend: `Êtes-vous sûr de vouloir suspendre l'utilisateur "${this.selectedUser.full_name}" ? Il ne pourra plus se connecter.`,
      activate: `Êtes-vous sûr de vouloir activer l'utilisateur "${this.selectedUser.full_name}" ?`,
      delete: `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "${this.selectedUser.full_name}" ? Cette action est irréversible.`
    };
    return messages[this.modalAction] || '';
  }

  /**
   * Vérifie si un utilisateur peut être suspendu
   */
  canSuspend(user: User): boolean {
    return user.status === 'active';
  }

  /**
   * Vérifie si un utilisateur peut être activé
   */
  canActivate(user: User): boolean {
    return user.status === 'suspended' || user.status === 'inactive';
  }

  /**
   * Affiche un message de succès
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  /**
   * Gère les erreurs
   */
  private handleError(message: string, error: unknown): void {
    console.error(message, error);

    if (error && typeof error === 'object' && 'error' in error) {
      const errorObj = error as { error?: { message?: string } | string };
      if (typeof errorObj.error === 'string') {
        this.errorMessage = errorObj.error;
      } else if (errorObj.error?.message) {
        this.errorMessage = errorObj.error.message;
      } else {
        this.errorMessage = message;
      }
    } else {
      this.errorMessage = message;
    }

    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  /**
   * Efface les messages
   */
  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Détermine si la liste est vide
   */
  get hasNoUsers(): boolean {
    return !this.isLoading && this.filteredUsers.length === 0;
  }

  /**
   * Détermine si des filtres sont appliqués
   */
  get hasActiveFilters(): boolean {
    return !!(
      this.selectedUserType ||
      this.selectedStatus ||
      this.searchControl.value
    );
  }
}
