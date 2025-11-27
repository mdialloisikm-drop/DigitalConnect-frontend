import { Component } from '@angular/core';
import {Router} from "@angular/router";
import {AuthService} from "../../services/auth.service";

@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.css'
})
export class AdminLayoutComponent {
  isSidebarOpen = true;
  currentUser = this.authService.currentUserValue;

  menuItems = [
    {
      icon: 'fa-chart-line',
      label: 'Dashboard',
      route: '/admin/dashboard',
      active: true
    },
    {
      icon: 'fa-solid fa-layer-group',
      label: 'Catégories',
      route: '/admin/categories',
      active: false
    },
    {
      icon: 'fa-award',
      label: 'Compétences',
      route: '/admin/skills',
      active: false
    },
    {
      icon: 'fa-users',
      label: 'Utilisateurs',
      route: '/admin/users',
      active: false
    },
    {
      icon: 'fa-solid fa-briefcase',
      label: 'Projets en attente',
      route: '/admin/projects/pending',
      active: false
    },
    {
      icon: 'fa-solid fa-boxes-packing',
      label: 'Services en attente',
      route: '/admin/services/pending',
      active: false
    }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: () => {
        this.authService.forceLogout();
        this.router.navigate(['/']);
      }
    });
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route;
  }
}
