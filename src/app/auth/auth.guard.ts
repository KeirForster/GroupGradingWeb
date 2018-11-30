// Angular modules
import { Injectable } from '@angular/core';
import {
    CanActivate,
    ActivatedRouteSnapshot,
    RouterStateSnapshot,
    Router
} from '@angular/router';
import { Observable } from 'rxjs';

// App
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private router: Router, private authService: AuthService) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        return this.isAuthenticated();
    }

    /**
     * Check if the current user is authenticated.
     * Redirect an unauthenticated user to the login path.
     *
     * @returns the current user's authentication status
     *
     * @privateApi
     */
    private isAuthenticated(): boolean {
        if (this.authService.isAuthenticated()) {
            // user is authenticated
            return true;
        } else {
            // user is not authenticated

            // navigate to the login page
            this.router.navigate(['/login']);
            return false;
        }
    }
}
