import { Component, OnInit } from '@angular/core';
import { Institution } from '../../../shared/models/institution';
import { TenantInstitutionStateService } from '../../../core/services/tenant-institution-state.service';

@Component({
  selector: 'app-department-details',
  templateUrl: './department-details.component.html',
  styleUrl: './department-details.component.scss'
})
export class DepartmentDetailsComponent implements OnInit {
  institution!: Institution;

  constructor(private readonly tenantInstitutionStateService: TenantInstitutionStateService) {}

  ngOnInit(): void {
    this.tenantInstitutionStateService.currentTenantInstitution$.subscribe({
      next: (data) => { 
        if(!data) return;
        this.institution = data; 
      },
      error: (error) => console.error('Error al obtener los datos de la institución', error)
    });
  }
}
