import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TenantService } from '../../services/tenant.service';
import { environment } from '../../../environments/environment';

@Injectable()
export class TenantInterceptor implements HttpInterceptor {

  constructor(private readonly tenantService: TenantService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Solo agregar el header en requests al propio backend
    const isBackendRequest =
      request.url.includes(environment.BACK_END_HOST_DEV) ||
      request.url.includes(environment.BACK_END_HOST_DEV_AUTH);

    if (!isBackendRequest) {
      return next.handle(request);
    }

    const slug = this.tenantService.getSlug();
    if (!slug) {
      return next.handle(request);
    }

    const tenantReq = request.clone({
      setHeaders: { 'X-Tenant-Slug': slug }
    });

    return next.handle(tenantReq);
  }
}
