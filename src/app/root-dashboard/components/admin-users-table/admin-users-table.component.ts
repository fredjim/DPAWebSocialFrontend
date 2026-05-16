import { Component, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';
import { TableColumn } from '../../../shared/components/custom-table/custom-table.component';

const ONLY_LETTERS = /^[a-zA-Z\s]+$/;
const PHONE_8_DIGITS = /^\d{8}$/;

@Component({
  selector: 'app-admin-users-table',
  templateUrl: './admin-users-table.component.html',
  styleUrl: './admin-users-table.component.scss'
})
export class AdminUsersTableComponent implements OnInit {

  @Input({ required: true }) institutionUuid!: string;

  admins: AdminUser[] = [];
  isLoading = signal(false);
  showDialog = signal(false);
  isSaving = signal(false);
  isEditMode = signal(false);
  selectedUuid: string | null = null;
  showPassword = false;

  columns: TableColumn[] = [
    { field: 'name', header: 'Nombre', sortable: true, type: 'text' },
    { field: 'lastName', header: 'Apellidos', sortable: true, type: 'text' },
    { field: 'email', header: 'Email', sortable: true, type: 'text' },
    { field: 'phone', header: 'Teléfono', sortable: false, type: 'text' }
  ];

  globalFilterFields = ['name', 'lastName', 'email', 'phone'];

  form!: FormGroup;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminUserService: AdminUserService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.buildForm();
    this.loadAdmins();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(ONLY_LETTERS)]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern(ONLY_LETTERS)]],
      email:    ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      phone:    ['', [Validators.pattern(PHONE_8_DIGITS)]]
    });
  }

  loadAdmins(): void {
    this.isLoading.set(true);
    this.adminUserService.getByInstitution(this.institutionUuid).subscribe({
      next: data => {
        this.admins = data;
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastRef.showError('No se pudieron cargar los administradores', 'Error');
      }
    });
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedUuid = null;
    this.form.reset();
    this.form.get('password')!.setValidators([Validators.required, Validators.minLength(8), Validators.maxLength(20)]);
    this.form.get('password')!.updateValueAndValidity();
    this.showDialog.set(true);
  }

  openEditDialog(admin: AdminUser): void {
    this.isEditMode.set(true);
    this.selectedUuid = admin.uuid;
    this.form.patchValue({ name: admin.name, lastName: admin.lastName, email: admin.email, phone: admin.phone ?? '' });
    // Password not required on edit
    this.form.get('password')!.clearValidators();
    this.form.get('password')!.setValue('');
    this.form.get('password')!.updateValueAndValidity();
    this.showDialog.set(true);
  }

  saveUser(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving.set(true);

    if (this.isEditMode()) {
      const dto: any = { name: this.form.value.name, lastName: this.form.value.lastName, email: this.form.value.email };
      if (this.form.value.phone) dto.phone = this.form.value.phone;
      if (this.form.value.password) dto.password = this.form.value.password;

      this.adminUserService.update(this.selectedUuid!, dto)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: updated => {
            const idx = this.admins.findIndex(a => a.uuid === updated.uuid);
            if (idx > -1) this.admins[idx] = updated;
            this.admins = [...this.admins];
            this.toastRef.showSuccess('Administrador actualizado', 'Actualizado');
            this.showDialog.set(false);
          },
          error: err => this.toastRef.showError(err.error?.message ?? 'No se pudo actualizar', 'Error')
        });
    } else {
      const dto = { ...this.form.value, institutionId: this.institutionUuid };
      this.adminUserService.create(dto)
        .pipe(finalize(() => this.isSaving.set(false)))
        .subscribe({
          next: created => {
            this.admins = [...this.admins, created];
            this.toastRef.showSuccess('Administrador creado exitosamente', 'Creado');
            this.showDialog.set(false);
          },
          error: err => this.toastRef.showError(err.error?.message ?? 'No se pudo crear el administrador', 'Error')
        });
    }
  }

  confirmDelete(admin: AdminUser): void {
    this.confirmationService.confirm({
      message: `¿Eliminar al administrador <strong>${admin.name} ${admin.lastName}</strong>?`,
      header: 'Confirmar eliminación',
      icon: 'fa-solid fa-user-minus',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: 'fa-solid fa-trash-can me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => {
        this.adminUserService.delete(admin.uuid).subscribe({
          next: () => {
            this.admins = this.admins.filter(a => a.uuid !== admin.uuid);
            this.toastRef.showSuccess('Administrador eliminado', 'Eliminado');
          },
          error: () => this.toastRef.showError('No se pudo eliminar', 'Error')
        });
      }
    });
  }

  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c?.hasError(error) && c.touched);
  }

  get dialogTitle(): string {
    return this.isEditMode() ? 'Editar administrador' : 'Nuevo administrador';
  }
}
