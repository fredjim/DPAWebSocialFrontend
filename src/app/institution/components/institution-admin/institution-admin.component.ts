import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { TenantService } from '../../../core/services/tenant.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-institution-admin',
  templateUrl: './institution-admin.component.html',
  styleUrl: './institution-admin.component.scss'
})
export class InstitutionAdminComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  institutionUuid = signal('');
  isLoading = signal(true);

  constructor(private readonly tenantService: TenantService) {}

  ngOnInit(): void {
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: inst => {
          this.institutionUuid.set(inst.uuid);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
