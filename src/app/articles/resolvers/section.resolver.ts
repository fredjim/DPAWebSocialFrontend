import { ActivatedRouteSnapshot, ResolveFn, Router } from "@angular/router";
import { Section } from "../../shared/models/section";
import { inject } from "@angular/core";
import { SectionService } from "../../layout/services/section.service";
import { catchError, of } from "rxjs";

export const SectionResolver: ResolveFn<Section | null> = (route: ActivatedRouteSnapshot) => {
  const sectionService = inject(SectionService);
  const router = inject(Router);
  
  const routeParam = route.paramMap.get('pathSection') ?? '';
  
  return sectionService.getSectionByPath(routeParam).pipe(
    catchError(error => {
      // Redirigir si hay error
      router.navigate(['/not-found']);
      return of(null);
    })
  );
};