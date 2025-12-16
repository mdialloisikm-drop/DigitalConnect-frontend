import {Component, OnInit, OnDestroy, HostListener, ChangeDetectorRef} from '@angular/core';
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
  isAuthRoute = false;

  // Modal de confirmation de déconnexion
  showLogoutModal = false;
  isLoggingOut = false;

  private readonly destroy$ = new Subject<void>();
  private readonly UNREAD_POLLING_INTERVAL = 30000;

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
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeAuthenticationListener();
    this.initializeRouteListener();
    this.checkAuthRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.body.style.overflow = '';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    this.closeUserMenuOnClickOutside(event);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.showLogoutModal) {
      this.closeLogoutModal();
    }
  }

  getUserAvatar(): string {
    // Utiliser avatar_url retourné par le backend (URL S3 complète)
    if (this.currentUser?.avatar_url) {
      return this.currentUser.avatar_url;
    }

    // Fallback:  si avatar existe mais pas avatar_url (ancienne donnée)
    if (this.currentUser?.avatar) {
      if (this.currentUser.avatar.startsWith('http')) {
        return this.currentUser.avatar;
      }
    }

    // Fallback:  générer un avatar par défaut
    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    const name = this.currentUser?.full_name || this.currentUser?.email || 'User';
    imgElement.src = `https://ui-avatars.com/api/? name=${encodeURIComponent(name)}&background=3b82f6&color=fff&size=128`;
  }

  isFreelance(): boolean {
    return this. currentUser?.user_type === 'freelance';
  }

  isClient(): boolean {
    return this. currentUser?.user_type === 'client';
  }

  isAdmin(): boolean {
    return this.currentUser?.user_type === 'admin';
  }


  getDashboardRoute(): string {
    if (this.isFreelance()) return '/freelance/dashboard';
    if (this.isClient()) return '/client/dashboard';
    return '/';
  }

  toggleMenu(): void {
    this. isMenuOpen = !this.isMenuOpen;
    this.cdr.markForCheck();
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen = ! this.isUserMenuOpen;
    this.cdr.markForCheck();
  }

  closeUserMenu(): void {
    this.isUserMenuOpen = false;
    this.cdr.markForCheck();
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
    this.closeUserMenu();
    this.isMenuOpen = false;
    document.body.style.overflow = 'hidden';
    this.cdr.markForCheck();
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
    this.isLoggingOut = false;
    document.body.style.overflow = '';
    this.cdr.markForCheck();
  }

  async confirmLogout(): Promise<void> {
    this.isLoggingOut = true;
    this.cdr.markForCheck();

    try {
      await this.fcmService.deleteToken();
    } catch (error) {
      console.warn('Erreur FCM ignorée:', error);
    }

    this.performLogout();
  }

  private checkAuthRoute(): void {
    const currentUrl = this.router.url. split('?')[0];
    this.isAuthRoute = this.AUTH_ROUTES.some(route => currentUrl.startsWith(route));
    this.cdr.markForCheck();
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
          this.cdr.markForCheck();
        },
        error: () => {
          this.unreadMessagesCount = 0;
          this.cdr.markForCheck();
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
        this.checkAuthRoute();
      });
  }

  private initializeUnreadMessagesPolling(): void {
    interval(this. UNREAD_POLLING_INTERVAL)
      .pipe(
        filter(() => this.isAuthenticated && !!this.currentUser),
        switchMap(() => this.messageHttpService.getUnreadCount()),
        map(response => response.count),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (count: number) => {
          this.unreadMessagesCount = count;
          this.cdr.markForCheck();
        }
      });
  }

  private loadUnreadMessagesCount(): void {
    if (! this.isAuthenticated || !this.currentUser) {
      this.unreadMessagesCount = 0;
      return;
    }

    this. messageHttpService.getUnreadCount()
      .pipe(
        map(response => response.count),
        takeUntil(this. destroy$)
      )
      .subscribe({
        next: (count: number) => {
          this.unreadMessagesCount = count;
          this.cdr.markForCheck();
        },
        error: () => {
          this.unreadMessagesCount = 0;
          this. cdr.markForCheck();
        }
      });
  }

  private updateNavbarVisibility(): void {
    const isAdminRoute = this.router.url.startsWith('/admin');
    const isAdmin = this.currentUser?.user_type === 'admin';
    this.shouldDisplayNavbar = !(isAdmin && isAdminRoute);
    this. cdr.markForCheck();
  }

  private closeUserMenuOnClickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative') && !this.showLogoutModal) {
      this.isUserMenuOpen = false;
      this.cdr.markForCheck();
    }
  }

  private performLogout(): void {
    this.authService.logout()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.handleLogoutSuccess(),
        error: () => this.handleLogoutSuccess()
      });
  }

  private handleLogoutSuccess(): void {
    this.closeLogoutModal();
    this. isMenuOpen = false;
    this. isUserMenuOpen = false;
    this.unreadMessagesCount = 0;
    this.cdr.markForCheck();
    this.router.navigate(['/']);
  }
}
