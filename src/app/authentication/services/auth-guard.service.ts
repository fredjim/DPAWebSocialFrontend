import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, Router } from "@angular/router";
import { AuthService } from "./auth.service";


@Injectable({
  providedIn: 'root'
})
export class AuthGuardService {

  constructor(public auth: AuthService, public router: Router) { }

  canActivate(route: ActivatedRouteSnapshot): boolean {
    if (this.auth.tokenHasExpired()) {
      this.auth.logout();
    }

    if (!this.auth.isAuthenticated()) {
      this.router.navigate(['/']);

      return false;
      
    }
    
    if (route.data["roles"]) {
      let splittedRoles = route.data["roles"].split(",");
      let result = splittedRoles.some((r:any) => this.auth.getRoles().includes(r))

      if (!result) {
        this.router.navigate(['/']);
        return false;
      }
    }

    return true;
  }
}
