import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, tap } from "rxjs";
import { InstitutionService } from "../../institution/services/institution.service";
import { Institution } from "../../shared/models/institution";

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private readonly ownInstitutionSlugSubject = new BehaviorSubject<string | null>(null);
  readonly ownInstitutionSlug$ = this.ownInstitutionSlugSubject.asObservable();

  constructor(private readonly institutionService: InstitutionService) {}

  loadOwnInstitution(institutionId: string): Observable<Institution> {
    return this.institutionService.getInstitution(institutionId).pipe(
      tap(institution => this.ownInstitutionSlugSubject.next(institution.slug))
    );
  }

  getOwnInstitutionSlugSnapshot(): string | null {
    return this.ownInstitutionSlugSubject.getValue();
  }

  clear(): void {
    this.ownInstitutionSlugSubject.next(null);
  }
}