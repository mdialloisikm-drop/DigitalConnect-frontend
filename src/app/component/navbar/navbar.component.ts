import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter, interval } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MessageHttpService } from '../../services/message-http.service';
import { FcmService } from '../../services/fcm.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isUserMenuOpen = false;
  isAuthenticated = false;
  currentUser: User | null = null;
  shouldDisplayNavbar = true;
  unreadMessagesCount = 0;
  isAuthRoute = false; // 🔥 NOUVELLE PROPRIÉTÉ

  private readonly DEFAULT_AVATAR = 'https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff&size=128';
  private readonly destroy$ = new Subject<void>();
  private readonly UNREAD_POLLING_INTERVAL = 30000;

  // 🔥 ROUTES D'AUTHENTIFICATION - MISE À JOUR COMPLÈTE
  private readonly AUTH_ROUTES = [
    '/login',
    '/register',
    '/register/details',
    '/register/verify-email',
    '/auth/verify-email',
    '/forgot-password',
    '/reset-password'
  ];

  constructor(
    private readonly authService: AuthService,
    private readonly messageHttpService: MessageHttpService,
    private readonly fcmService: FcmService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.initializeAuthenticationListener();
    this.initializeRouteListener();
    this.checkAuthRoute(); // 🔥 Vérifier la route initiale
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.closeUserMenuOnClickOutside(event);
  }

  getUserAvatar(): string {
    if (this.currentUser?.avatar) {
      if (this.currentUser.avatar.startsWith('http://') || this.currentUser.avatar.startsWith('https://')) {
        return this.currentUser.avatar;
      }
      return `http://localhost:8000/storage/avatars/${this.currentUser.avatar}`;
    }

    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    imgElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  isFreelance(): boolean {
    return this.currentUser?.user_type === 'freelance';
  }

  isClient(): boolean {
    return this.currentUser?.user_type === 'client';
  }

  isAdmin(): boolean {
    return this.currentUser?.user_type === 'admin';
  }

  getUserTypeLabel(): string {
    const labels: Record<string, string> = {
      'freelance': 'Freelance',
      'client': 'Client',
      'admin': 'Administrateur'
    };
    return this.currentUser?.user_type ? labels[this.currentUser.user_type] : 'Utilisateur';
  }

  getDashboardRoute(): string {
    if (this.isFreelance()) {
      return '/freelance/dashboard';
    } else if (this.isClient()) {
      return '/client/dashboard';
    }
    return '/';
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  async logout(): Promise<void> {
    if (!confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      return;
    }

    try {
      console.log('🔄 Suppression du token FCM...');
      await this.fcmService.deleteToken();
      console.log('✅ Token FCM supprimé');
    } catch (error) {
      console.warn('⚠️ Erreur lors de la suppression du token FCM (ignorée):', error);
    }

    this.performLogout();
  }

  // 🔥 MÉTHODE POUR VÉRIFIER SI ON EST SUR UNE ROUTE D'AUTHENTIFICATION
  private checkAuthRoute(): void {
    const currentUrl = this.router.url.split('?')[0]; // Enlever les query params
    this.isAuthRoute = this.AUTH_ROUTES.some(route => currentUrl.startsWith(route));
  }

  private initializeAuthenticationListener(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: User | null) => {
          this.currentUser = user;
          this.isAuthenticated = !!user;
          this.updateNavbarVisibility();

          if (this.isAuthenticated && user) {
            this.loadUnreadMessagesCount();
            this.initializeUnreadMessagesPolling();
          } else {
            this.unreadMessagesCount = 0;
          }
        },
        error: (error: Error) => {
          console.error('Erreur lors de la récupération de l\'utilisateur:', error);
          this.unreadMessagesCount = 0;
        }
      });
  }

  private initializeRouteListener(): void {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.updateNavbarVisibility();
        this.checkAuthRoute(); // 🔥 Vérifier la route à chaque navigation
      });
  }

  private initializeUnreadMessagesPolling(): void {
    interval(this.UNREAD_POLLING_INTERVAL)
      .pipe(
        filter(() => this.isAuthenticated && !!this.currentUser),
        switchMap(() => this.messageHttpService.getUnreadCount()),
        map(response => response.count),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (count: number) => {
          this.unreadMessagesCount = count;
        },
        error: (error: Error) => {
          console.error('Erreur lors de la récupération des messages non lus (polling):', error);
        }
      });
  }

  private loadUnreadMessagesCount(): void {
    if (!this.isAuthenticated || !this.currentUser) {
      this.unreadMessagesCount = 0;
      return;
    }

    this.messageHttpService.getUnreadCount()
      .pipe(
        map(response => response.count),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (count: number) => {
          this.unreadMessagesCount = count;
        },
        error: (error: Error) => {
          console.error('Erreur lors de la récupération des messages non lus:', error);
          this.unreadMessagesCount = 0;
        }
      });
  }

  private updateNavbarVisibility(): void {
    const isAdminRoute = this.router.url.startsWith('/admin');
    const isAdmin = this.currentUser?.user_type === 'admin';

    this.shouldDisplayNavbar = !(isAdmin && isAdminRoute);
  }

  private closeUserMenuOnClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.isUserMenuOpen = false;
    }
  }

  private performLogout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleLogoutSuccess(),
        error: (error: Error) => this.handleLogoutError(error)
      });
  }

  private handleLogoutSuccess(): void {
    this.closeAllMenus();
    this.unreadMessagesCount = 0;
    this.router.navigate(['/']);
  }

  private handleLogoutError(error: Error): void {
    console.error('Erreur lors de la déconnexion:', error);
    this.closeAllMenus();
    this.unreadMessagesCount = 0;
    this.router.navigate(['/']);
  }

  private closeAllMenus(): void {
    this.isMenuOpen = false;
    this.isUserMenuOpen = false;
  }
}
