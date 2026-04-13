import { Component, OnInit } from '@angular/core';
import { TenantService } from '../../../services/tenant.service';

@Component({
  selector: 'app-department-details',
  templateUrl: './department-details.component.html',
  styleUrl: './department-details.component.scss'
})
export class DepartmentDetailsComponent implements OnInit {
  institution: any;

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {
    this.tenantService.getInstitution().subscribe({
      next: (data) => { this.institution = data; },
      error: (error) => { console.error('Error al obtener los datos de la institución', error); }
    });
  }
}
