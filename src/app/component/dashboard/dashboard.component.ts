import {Component, OnInit} from '@angular/core';
import {AdminService, DashboardStats} from "../../services/admin.service";

interface StatCard {
  icon: string;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{
  loading = true;
  stats: DashboardStats | null = null;
  statCards: StatCard[] = [];
  error = false;
  errorMessage = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = false;

    this.adminService.getDashboardStats().subscribe({
      next: (data: DashboardStats) => {
        this.stats = data;
        this.prepareStatCards();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
        this.loading = false;
        this.error = true;
        this.errorMessage = 'Erreur lors du chargement des statistiques';
      }
    });
  }

  prepareStatCards(): void {
    if (!this.stats) return;

    this.statCards = [
      {
        icon: 'fa-project-diagram',
        label: 'Total Projets',
        value: this.stats.total_projects,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        icon: 'fa-briefcase',
        label: 'Total Services',
        value: this.stats.total_services,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        icon: 'fa-users',
        label: 'Total Utilisateurs',
        value: this.stats.total_users,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      },
      {
        icon: 'fa-user-tie',
        label: 'Freelances',
        value: this.stats.total_freelances,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      },
      {
        icon: 'fa-user-friends',
        label: 'Clients',
        value: this.stats.total_clients,
        color: 'text-pink-600',
        bgColor: 'bg-pink-100'
      },
      {
        icon: 'fa-folder',
        label: 'Catégories',
        value: this.stats.total_categories,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-100'
      },
      {
        icon: 'fa-award',
        label: 'Compétences',
        value: this.stats.total_skills,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-100'
      },
      {
        icon: 'fa-check-circle',
        label: 'Projets Actifs',
        value: this.stats.active_projects,
        color: 'text-teal-600',
        bgColor: 'bg-teal-100'
      }
    ];
  }
}
