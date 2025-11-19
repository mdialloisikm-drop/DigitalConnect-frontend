import {Component, OnDestroy, OnInit} from '@angular/core';
import {FreelanceDashboardStats, FreelanceService} from "../../services/freelance.service";
import {finalize, Subject, takeUntil} from "rxjs";


/**
 * Interface pour les cartes de statistiques
 */
interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}

@Component({
  selector: 'app-freelance-dashboard',
  templateUrl: './freelance-dashboard.component.html',
  styleUrl: './freelance-dashboard.component.css'
})
export class FreelanceDashboardComponent implements OnInit, OnDestroy {
  stats: FreelanceDashboardStats | null = null;
  statCards: StatCard[] = [];
  isLoading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly freelanceService: FreelanceService) {}

  ngOnInit(): void {
    this.loadDashboardStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Charge les statistiques du dashboard
   */
  loadDashboardStats(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.freelanceService.getDashboardStats()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (stats: FreelanceDashboardStats) => {
          this.stats = stats;
          this.buildStatCards(stats);
        },
        error: (error: Error) => {
          this.errorMessage = error.message || 'Erreur lors du chargement des statistiques';
          console.error('Erreur lors du chargement des statistiques:', error);
          // Utiliser des données par défaut en cas d'erreur
          this.buildStatCards(this.getDefaultStats());
        }
      });
  }

  /**
   * Construit les cartes de statistiques
   */
  private buildStatCards(stats: FreelanceDashboardStats): void {
    this.statCards = [
      {
        title: 'Total Services',
        value: stats.total_services,
        icon: 'fas fa-briefcase',
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        description: 'Services publiés'
      },
      {
        title: 'Commandes Actives',
        value: stats.active_orders,
        icon: 'fas fa-clock',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        description: 'En cours de traitement'
      },
      {
        title: 'Commandes Terminées',
        value: stats.completed_orders,
        icon: 'fas fa-check-circle',
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        description: 'Livrées avec succès'
      },
      {
        title: 'Total Commandes',
        value: stats.total_orders,
        icon: 'fas fa-shopping-cart',
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        description: 'Toutes les commandes'
      },
      {
        title: 'Contrats Actifs',
        value: stats.active_contracts,
        icon: 'fas fa-file-contract',
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100',
        description: 'Projets en cours'
      },
      {
        title: 'Total Contrats',
        value: stats.total_contracts,
        icon: 'fas fa-handshake',
        color: 'text-teal-600',
        bgColor: 'bg-teal-100',
        description: 'Tous les contrats'
      }
    ];
  }

  /**
   * Retourne des statistiques par défaut
   */
  private getDefaultStats(): FreelanceDashboardStats {
    return {
      total_services: 0,
      total_orders: 0,
      active_orders: 0,
      completed_orders: 0,
      total_contracts: 0,
      active_contracts: 0,
      total_earnings: 0,
      pending_earnings: 0
    };
  }

  /**
   * Rafraîchit les statistiques
   */
  refreshStats(): void {
    this.loadDashboardStats();
  }
}
