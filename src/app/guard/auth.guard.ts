import { Injectable } from '@angular/core';
import {Router, ActivatedRouteSnapshot, RouterStateSnapshot, CanActivate} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this.authService.isAuthenticated) {
      // Vérifier les rôles si spécifiés
      const requiredRoles = route.data['roles'] as string[];

      if (requiredRoles && requiredRoles.length > 0) {
        const userType = this.authService.currentUserValue?.user_type;

        if (userType && requiredRoles.includes(userType)) {
          return true;
        } else {
          // Rediriger vers la page d'accueil si pas les bons droits
          this.router.navigate(['/']);
          return false;
        }
      }

      return true;
    }

    // Rediriger vers la page de connexion avec l'URL de retour
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
}
