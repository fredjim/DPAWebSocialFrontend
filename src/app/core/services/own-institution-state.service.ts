import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, shareReplay, tap } from "rxjs";
import { InstitutionService } from "../../institution/services/institution.service";
import { Institution } from "../../shared/models/institution";
import { TenantInstitutionStateService } from "./tenant-institution-state.service";

@Injectable({ providedIn: 'root' })
/**
 * Estado de la institución propia del usuario logueado (vía JWT)
 */
export class OwnInstitutionStateService {
  private readonly ownInstitutionSubject = new BehaviorSubject<Institution | null>(null);
  readonly ownInstitution$ = this.ownInstitutionSubject.asObservable();

  constructor(
    private readonly institutionService: InstitutionService,
    private readonly tenantInstitutionStateService: TenantInstitutionStateService
  ) {}

  loadOwnInstitution(institutionId: string): Observable<Institution> {
    return this.institutionService.getInstitutionByUuid(institutionId).pipe(
      tap(institution => this.ownInstitutionSubject.next(institution)),
      shareReplay(1)
    );
  }

  updateOwnInstitution(body: Partial<Institution>): Observable<Institution> {
    return this.institutionService.updateInstitutionData(body).pipe(
      tap(institution => {
        this.ownInstitutionSubject.next(institution);
        this.tenantInstitutionStateService.syncIfSameInstitution(institution);
      })
    );
  }

  getOwnInstitutionSnapshot(): Institution | null {
    return this.ownInstitutionSubject.getValue();
  }

  // El tenantGuard solo necesita el slug
  getOwnInstitutionSlugSnapshot(): string | null {
    return this.ownInstitutionSubject.getValue()?.slug ?? null;
  }

  clear(): void {
    this.ownInstitutionSubject.next(null);
  }
}