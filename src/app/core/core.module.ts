import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthInterceptor } from './interceptors/auth-interceptor';
import { TenantInterceptor } from './interceptors/tenant-interceptor';

/**
 * CoreModule — se importa UNA sola vez en AppModule.
 * Contiene interceptors HTTP, guards globales y servicios singleton.
 * NO declarar componentes aquí.
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]
})
export class CoreModule {
  // Previene que CoreModule sea importado más de una vez
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule ya fue cargado. Importarlo solo en AppModule.');
    }
  }
}