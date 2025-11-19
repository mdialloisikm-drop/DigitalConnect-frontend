import {Component, OnInit} from '@angular/core';
import {AuthService} from "../../services/auth.service";
import {User} from "../../models/user";
import {Router} from "@angular/router";

interface MenuItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-client-layout',
  templateUrl: './client-layout.component.html',
  styleUrl: './client-layout.component.css'
})
export class ClientLayoutComponent implements OnInit  {
  isSidebarOpen = true;
  currentUser: User | null = null;

  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      route: '/client/dashboard',
      icon: 'fa-chart-line'
    },
    {
      label: 'Mes Projets',
      route: '/client/projects',
      icon: 'fa-folder-open'
    },
    {
      label: 'Candidatures',
      route: '/client/proposals',
      icon: 'fa-file-alt'
    }
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
   * Charger l'utilisateur actuel
   */
  private loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;
  }

  /**
   * Basculer l'état du sidebar
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Déconnexion
   */
  logout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
