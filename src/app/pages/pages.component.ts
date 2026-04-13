import { Component, OnInit } from '@angular/core';
import { TenantService } from '../services/tenant.service';
import { InstitutionStateService } from '../services/institution-state.service';

@Component({
  selector: 'app-pages',
  templateUrl: './pages.component.html',
  styleUrl: './pages.component.scss'
})
export class PagesComponent implements OnInit {

  constructor(
    private readonly tenantService: TenantService,
    private readonly institutionStateService: InstitutionStateService
  ){}

  ngOnInit(): void {
    this.tenantService.getInstitution().subscribe({
      next: (institution) => {
        this.institutionStateService.setInstitution(institution);
      },
      error: (err) => {
        console.log('Error al obtener institucion para informacion', err);
        this.institutionStateService.setInstitution(null);
      }
    });
  }
}
