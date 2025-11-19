import {Component, OnDestroy, OnInit} from '@angular/core';
import {filter, Subject, takeUntil} from "rxjs";
import {User} from "../../models/user";
import {AuthService} from "../../services/auth.service";
import {NavigationEnd, Router} from "@angular/router";

/**
 * Interface pour les éléments du menu sidebar
 */
interface SidebarMenuItem {
  label: string;
  icon: string;
  route: string;
  active: boolean;
}

@Component({
  selector: 'app-freelance-layout',
  templateUrl: './freelance-layout.component.html',
  styleUrl: './freelance-layout.component.css'
})
export class FreelanceLayoutComponent implements OnInit, OnDestroy{
  isSidebarOpen = true;
  currentUser: User | null = null;

  menuItems: SidebarMenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'fas fa-chart-line',
      route: '/freelance/dashboard',
      active: false
    },
    {
      label: 'Services',
      icon: 'fas fa-briefcase',
      route: '/freelance/services',
      active: false
    },
    {
      label: 'Contrats',
      icon: 'fas fa-file-contract',
      route: '/freelance/contracts',
      active: false
    },
    {
      label: 'Commandes',
      icon: 'fas fa-shopping-cart',
      route: '/freelance/orders',
      active: false
    }
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeUser();
    this.initializeRouteListener();
    this.updateActiveMenuItem();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Bascule l'état du sidebar (ouvert/fermé)
   */
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  /**
   * Récupère l'avatar de l'utilisateur
   */
  getUserAvatar(): string {
    if (this.currentUser?.avatar) {
      if (this.currentUser.avatar.startsWith('http://') ||
        this.currentUser.avatar.startsWith('https://')) {
        return this.currentUser.avatar;
      }
      return `http://localhost:8000/storage/avatars/${this.currentUser.avatar}`;
    }

    const name = this.currentUser?.full_name || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  /**
   * Gestionnaire d'erreur pour les images
   */
  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const name = this.currentUser?.full_name || 'User';
    imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  /**
   * Initialise l'utilisateur courant
   */
  private initializeUser(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
        },
        error: (error: Error) => {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        }
      });
  }

  /**
   * Initialise l'écoute des changements de route
   */
  private initializeRouteListener(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateActiveMenuItem();
      });
  }

  /**
   * Met à jour l'élément actif du menu selon la route courante
   */
  private updateActiveMenuItem(): void {
    const currentUrl = this.router.url;
    this.menuItems.forEach(item => {
      item.active = currentUrl.startsWith(item.route);
    });
  }
}
