import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ConfirmationService } from 'primeng/api';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { Institution } from '../../models/institution.model';
import { InstitutionAdminService } from '../../services/institution-admin.service';
import { TableColumn } from '../../../shared/components/custom-table/custom-table.component';

@Component({
  selector: 'app-institution-list',
  templateUrl: './institution-list.component.html',
  styleUrl: './institution-list.component.scss'
})
export class InstitutionListComponent implements OnInit {

  institutions: Institution[] = [];
  isLoading = signal(false);
  showCreateModal = signal(false);
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  columns: TableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true, type: 'text' },
    { field: 'slug', header: 'Slug', sortable: true, type: 'badge' },
    { field: 'email', header: 'Email', sortable: true, type: 'text' },
    { field: 'category', header: 'Categoría', sortable: true, type: 'text' },
    { field: 'url', header: 'Sitio Web', sortable: false, type: 'text' }
  ];

  globalFilterFields = ['name', 'slug', 'email', 'category'];

  constructor(
    private readonly institutionService: InstitutionAdminService,
    private readonly confirmationService: ConfirmationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.loadInstitutions();
  }

  loadInstitutions(): void {
    this.isLoading.set(true);
    this.institutionService.getAll().subscribe({
      next: data => {
        this.institutions = data;
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastRef.showError('No se pudieron cargar las instituciones', 'Error');
      }
    });
  }

  onInstitutionCreated(institution: Institution): void {
    this.showCreateModal.set(false);
    this.router.navigate(['/root/institutions', institution.uuid]);
  }

  goToDetail(uuid: string): void {
    this.router.navigate(['/root/institutions', uuid]);
  }

  confirmDelete(institution: Institution): void {
    this.confirmationService.confirm({
      message: `¿Desea eliminar la institución <strong>${institution.name}</strong>? Esta acción no se puede deshacer.`,
      header: 'Confirmar eliminación',
      icon: 'fa-solid fa-triangle-exclamation',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: 'fa-solid fa-trash-can me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => this.deleteInstitution(institution.uuid!)
    });
  }

  private deleteInstitution(uuid: string): void {
    this.institutionService.delete(uuid).subscribe({
      next: () => {
        this.toastRef.showSuccess('Institución eliminada', 'Éxito');
        this.institutions = this.institutions.filter(i => i.uuid !== uuid);
      },
      error: () => this.toastRef.showError('No se pudo eliminar la institución', 'Error')
    });
  }
}
