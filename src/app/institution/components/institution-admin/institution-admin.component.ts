import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { OwnInstitutionStateService } from '../../../core/services/own-institution-state.service';
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

  constructor(private readonly ownInstitutionStateService: OwnInstitutionStateService) {}

  ngOnInit(): void {
    this.ownInstitutionStateService.ownInstitution$
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (inst) => {
        if (!inst) return;
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
