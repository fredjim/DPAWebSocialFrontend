import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, throwError, BehaviorSubject } from "rxjs";
import { catchError, switchMap, filter, take, map } from 'rxjs/operators';
import { AuthService } from "../../authentication/services/auth.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private readonly refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  // Verifica manualmente si el JWT ha expirado
  private isJwtExpired(token: string | null): boolean {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp;
      return Date.now() >= exp * 1000;
    } catch {
      return true;
    }
  }

  constructor(private readonly authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Excluir login, refresh y registro del manejo de token y refresh
    const isAuthRequest = request.url.includes('/login') || request.url.includes('/refresh') || request.url.includes('/register') || request.url.includes('/logout') || request.url.includes('/verify-email') || request.url.includes('/forgot-password') || request.url.includes('/reset-password');
    if (isAuthRequest) {
      return next.handle(request);
    }
    // Añadir access token si existe
    const token = this.authService.token;
    let authReq = request;
    if (token) {
      authReq = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Access token expirado (500 con mensaje, o 401 y el token está expirado manualmente)
        if (
          (error.status === 500 && error.error?.message === 'JWT has expired or is incorrect') ||
          (error.status === 401 && this.isJwtExpired(token))
        ) {
          if (!this.isRefreshing) {
            this.isRefreshing = true;
            this.refreshTokenSubject.next(null);
            const refreshObs = this.authService.refreshAccessToken();
            if (!refreshObs) {
              this.isRefreshing = false;
              this.refreshTokenSubject.next(null);
              this.authService.logout();
              return throwError(() => new Error('No refresh token observable'));
            }
            return refreshObs.pipe(
              map((res: any) => {
                this.isRefreshing = false;
                if (res.accessToken) {
                  this.authService.token = res.accessToken;
                  this.refreshTokenSubject.next(res.accessToken);
                }
                // refreshToken llega como cookie HttpOnly — el browser lo maneja solo
                const newReq = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${res.accessToken}`
                  }
                });
                return next.handle(newReq);
              }),
              switchMap((obs: Observable<HttpEvent<unknown>>) => obs),
              catchError((err) => {
                this.isRefreshing = false;
                this.refreshTokenSubject.next(null);
                this.authService.logout();
                return throwError(() => new Error('Token refresh failed'));
              })
            );
          } else {
            // Esperar a que el refresh termine y usar el nuevo token
            return this.refreshTokenSubject.pipe(
              filter(token => token != null),
              take(1),
              switchMap((newToken) => {
                const newReq = request.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
                });
                return next.handle(newReq);
              })
            );
          }
        }
        // Refresh token expirado o revocado
        if (error.status === 400 && error.error?.exception === 'Refresh token is revoked or expired') {
          this.authService.logout();
          return throwError(() => new Error('Refresh token expired'));
        }
        // Otros errores HTTP se pasan limpios sin ser envueltos en "Authentication failed"
        return throwError(() => error);
      })
    );
  }
  
}