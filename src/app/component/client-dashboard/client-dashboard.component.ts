import {Component, OnDestroy, OnInit} from '@angular/core';
import {finalize, Subject, takeUntil} from "rxjs";
import {ClientDashboardStats} from "../../models/client";
import {ClientService} from "../../services/client.service";
import {AuthService} from "../../services/auth.service";
import {Router} from "@angular/router";

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  bgColor: string;
  loading?: boolean;
}

@Component({
  selector: 'app-client-dashboard',
  templateUrl: './client-dashboard.component.html',
  styleUrl: './client-dashboard.component.css'
})
export class ClientDashboardComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  isLoading = true;
  errorMessage = '';
  stats: ClientDashboardStats | null = null;
  statCards: StatCard[] = [];

  constructor(
    private readonly clientService: ClientService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    // ✅ VÉRIFICATION : Est-ce que l'utilisateur est bien un client ?
    console.log('👤 Utilisateur actuel:', this.authService.currentUserValue);
    console.log('🔑 Token:', this.authService.token);
    console.log('🔐 Est authentifié?', this.authService.isAuthenticated);
    console.log('👨‍💼 Est client?', this.authService.isClient);

    if (!this.authService.isClient) {
      console.error('❌ Utilisateur non autorisé (pas un client)');
      this.errorMessage = 'Vous n\'êtes pas autorisé à accéder à cette page';
      this.isLoading = false;
      this.router.navigate(['/']);
      return;
    }

    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charger les statistiques depuis le backend
   */
  private loadDashboardData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    console.log('📊 Chargement des statistiques du dashboard...');

    this.clientService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          console.log('✅ Chargement terminé');
        })
      )
      .subscribe({
        next: (stats: ClientDashboardStats) => {
          console.log('✅ Statistiques reçues:', stats);
          this.stats = stats;
          this.buildStatCards();
        },
        error: (error) => {
          console.error('❌ Erreur complète:', error);

          // ✅ GESTION AMÉLIORÉE DES ERREURS
          if (error.status === 403) {
            this.errorMessage = 'Accès refusé. Vous devez être connecté en tant que client.';
            // Forcer la déconnexion et rediriger vers login
            setTimeout(() => {
              this.authService.forceLogout();
              this.router.navigate(['/login']);
            }, 2000);
          } else if (error.status === 401) {
            this.errorMessage = 'Session expirée. Veuillez vous reconnecter.';
            setTimeout(() => {
              this.authService.forceLogout();
              this.router.navigate(['/login']);
            }, 2000);
          } else {
            this.errorMessage = error.message || 'Erreur lors du chargement des statistiques';
          }
        }
      });
  }

  /**
   * Construire les cartes de statistiques
   */
  private buildStatCards(): void {
    if (!this.stats) return;

    this.statCards = [
      {
        title: 'Total Dépensé',
        value: this.formatCurrency(this.stats.total_spent),
        icon: 'fa-coins',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Projets Actifs',
        value: this.stats.active_projects,
        icon: 'fa-folder-open',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Total Projets',
        value: this.stats.total_projects,
        icon: 'fa-project-diagram',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        title: 'Projets Complétés',
        value: this.stats.completed_projects,
        icon: 'fa-check-circle',
        color: 'text-teal-600',
        bgColor: 'bg-teal-100'
      },
      {
        title: 'Total Candidatures',
        value: this.stats.total_proposals,
        icon: 'fa-file-alt',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      },
      {
        title: 'Candidatures en Attente',
        value: this.stats.pending_proposals,
        icon: 'fa-clock',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      }
    ];
  }

  /**
   * Formater la devise
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  }

  /**
   * Rafraîchir les données
   */
  refreshData(): void {
    this.loadDashboardData();
  }
}
