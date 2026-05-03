import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TenantService } from '../services/tenant.service';
import { InstitutionStateService } from '../services/institution-state.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss'
})
export class PagesComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly tenantService: TenantService,
    private readonly institutionStateService: InstitutionStateService
  ){}

  ngOnInit(): void {
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institution) => {
          this.institutionStateService.setInstitution(institution);
        },
        error: (err) => {
          console.log('Error al obtener institucion para informacion', err);
          this.institutionStateService.setInstitution(null);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
