import { Component, Input, OnInit, signal, ViewChild } from '@angular/core';
import { ConfirmationService } from 'primeng/api';
import { AdminUserService } from '../../../root-dashboard/services/admin-user.service';
import { AdminUser } from '../../../root-dashboard/models/admin-user.model';
import { TableColumn } from '../../../shared/components/custom-table/custom-table.component';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-institution-students-table',
  templateUrl: './institution-students-table.component.html',
  styleUrl: './institution-students-table.component.scss'
})
export class InstitutionStudentsTableComponent implements OnInit {

  @Input({ required: true }) institutionUuid!: string;

  students: AdminUser[] = [];
  totalRecords = 0;
  isLoading = signal(false);
  private lastLazyLoadEvent: any = null;

  columns: TableColumn[] = [
    { field: 'name',     header: 'Nombre',    sortable: true,  type: 'text' },
    { field: 'lastName', header: 'Apellidos', sortable: true,  type: 'text' },
    { field: 'email',    header: 'Email',     sortable: true,  type: 'text' },
    { field: 'phone',    header: 'Teléfono',  sortable: false, type: 'text' },
    { field: 'enabled',  header: 'Estado',    sortable: false, type: 'boolean' }
  ];

  globalFilterFields = ['name', 'lastName', 'email', 'phone'];

  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {}

  loadStudents(page: number = 0, size: number = 20, search: string = '', sort?: string): void {
    this.isLoading.set(true);
    this.adminUserService.getByInstitution(this.institutionUuid, page, size, search, 'STUDENT', undefined, sort)
      .subscribe({
        next: res => {
          this.students = res.content;
          this.totalRecords = res.totalElements;
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.toastRef.showError('No se pudieron cargar los estudiantes', 'Error');
        }
      });
  }

  onLazyLoad(event: any): void {
    this.lastLazyLoadEvent = event;
    const page = event.first / event.rows;
    const size = event.rows;
    const search = event.globalFilter || '';

    let sort: string | undefined;
    if (event.sortField) {
      const direction = event.sortOrder === 1 ? 'asc' : 'desc';
      sort = `${event.sortField},${direction}`;
    }

    this.loadStudents(page, size, search, sort);
  }

  confirmToggle(student: AdminUser): void {
    const isEnabled = student.enabled;
    this.confirmationService.confirm({
      message: isEnabled
        ? `¿Deshabilitar al estudiante <strong>${student.name} ${student.lastName}</strong>?`
        : `¿Habilitar al estudiante <strong>${student.name} ${student.lastName}</strong>?`,
      header: isEnabled ? 'Confirmar deshabilitación' : 'Confirmar habilitación',
      icon: isEnabled ? 'fa-solid fa-user-slash' : 'fa-solid fa-user-check',
      acceptLabel: isEnabled ? 'Deshabilitar' : 'Habilitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: isEnabled ? 'p-button-danger p-button-sm' : 'p-button-success p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: isEnabled ? 'fa-solid fa-user-slash me-2' : 'fa-solid fa-user-check me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => {
        this.adminUserService.disable(student.uuid).subscribe({
          next: () => {
            const msg = isEnabled ? 'Estudiante deshabilitado' : 'Estudiante habilitado';
            this.toastRef.showSuccess(msg, 'Éxito');
            this.reloadStudents();
          },
          error: () => {
            const errMsg = isEnabled ? 'No se pudo deshabilitar el estudiante' : 'No se pudo habilitar el estudiante';
            this.toastRef.showError(errMsg, 'Error');
          }
        });
      }
    });
  }

  private reloadStudents(): void {
    if (this.lastLazyLoadEvent) {
      this.onLazyLoad(this.lastLazyLoadEvent);
    } else {
      this.loadStudents();
    }
  }
}
