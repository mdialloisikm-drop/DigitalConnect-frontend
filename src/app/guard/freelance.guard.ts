import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard pour protéger les routes freelance
 * Vérifie que l'utilisateur est authentifié et est de type freelance
 */
@Injectable({
  providedIn: 'root'
})
export class FreelanceGuard {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.user_type === 'freelance') {
      return true;
    }

    // Rediriger vers la page de connexion si non authentifié
    if (!currentUser) {
      return this.router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Rediriger vers la page d'accueil si l'utilisateur n'est pas freelance
    return this.router.createUrlTree(['/']);
  }
}
