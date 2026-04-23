import { ActivatedRouteSnapshot, ResolveFn, Router } from "@angular/router";
import { Section } from "../pages/models/section";
import { inject } from "@angular/core";
import { InformationService } from "../pages/services/information.service";
import { catchError, of } from "rxjs";

export const SectionResolver: ResolveFn<Section | null> = (route: ActivatedRouteSnapshot) => {
  const informationService = inject(InformationService);
  const router = inject(Router);
  
  const routeParam = route.paramMap.get('pathSection') ?? '';
  
  return informationService.getSectionByPath(routeParam).pipe(
    catchError(error => {
      // Redirigir si hay error
      router.navigate(['/']);
      return of(null);
    })
  );
};