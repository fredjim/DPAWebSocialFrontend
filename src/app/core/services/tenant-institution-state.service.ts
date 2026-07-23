import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, shareReplay, tap } from "rxjs";
import { Institution } from "../../shared/models/institution";
import { InstitutionService } from "../../institution/services/institution.service";

@Injectable({ providedIn: 'root' })
/**
 * Estado global + cache de la institución que se está visitando actualmente (la del tenant activo).
 * Por el slug de la url
 */
export class TenantInstitutionStateService {
  private readonly currentTenantInstitutionSubject = new BehaviorSubject<Institution | null>(null);
  readonly currentTenantInstitution$ = this.currentTenantInstitutionSubject.asObservable();

  constructor(private readonly institutionService: InstitutionService) {}

  //El resultado se cachea con shareReplay(1) durante la vida de la sesión.
  loadCurrentTenantInstitution(): Observable<Institution> {
    return this.institutionService.getCurrentTenantInstitution().pipe(
      tap(institution => this.currentTenantInstitutionSubject.next(institution)),
      shareReplay(1)
    );
  }

  // Sincroniza el snapshot solo si la institución editada es la misma que se está visitando
  syncIfSameInstitution(updated: Institution): void {
    const current = this.currentTenantInstitutionSubject.getValue();
    if (current?.uuid === updated.uuid) {
      this.currentTenantInstitutionSubject.next(updated);
    }
  }

  getCurrentTenantInstitutionSnapshot(): Institution | null {
    return this.currentTenantInstitutionSubject.getValue();
  }

  clear(): void {
    this.currentTenantInstitutionSubject.next(null);
  }
}