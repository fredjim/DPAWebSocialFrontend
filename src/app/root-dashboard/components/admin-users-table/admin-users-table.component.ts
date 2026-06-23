import { Component, Input, OnInit, signal, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { AdminUser } from '../../models/admin-user.model';
import { AdminUserService } from '../../services/admin-user.service';
import { TableColumn } from '../../../shared/components/custom-table/custom-table.component';

const ONLY_LETTERS_AND_NUMBERS = /^[a-zA-Z0-9\s]+$/;
const PHONE_8_DIGITS = /^\d{8}$/;
interface PasswordValidationErrors {
  passwordLength?: true;
  missingLowercase?: true;
  missingUppercase?: true;
  missingNumber?: true;
  missingSpecialChar?: true;
}

@Component({
  selector: 'app-admin-users-table',
  templateUrl: './admin-users-table.component.html',
  styleUrl: './admin-users-table.component.scss'
})
export class AdminUsersTableComponent implements OnInit {

  @Input({ required: true }) institutionUuid!: string;

  admins: AdminUser[] = [];
  totalRecords = 0;
  lastLazyLoadEvent: any = null;
  isLoading = signal(false);
  showDialog = signal(false);
  isSaving = signal(false);
  isEditMode = signal(false);
  selectedUuid: string | null = null;
  showPassword = false;

  public readonly MIN_LENGTH_NAME = 3;
  public readonly MAX_LENGTH_NAME = 50;
  public readonly MIN_LENGTH_LASTNAME = 3;
  public readonly MAX_LENGTH_LASTNAME = 50;
  public readonly MIN_LENGTH_PASSWORD = 8;
  public readonly MAX_LENGTH_PASSWORD = 16;
  public readonly MAX_LENGTH_EMAIL = 50;

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
  }

  private buildForm(): void {
    this.form = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_NAME), Validators.maxLength(this.MAX_LENGTH_NAME), Validators.pattern(ONLY_LETTERS_AND_NUMBERS)]],
      lastName: ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_LASTNAME), Validators.maxLength(this.MAX_LENGTH_LASTNAME), Validators.pattern(ONLY_LETTERS_AND_NUMBERS)]],
      email:    ['', [Validators.required, Validators.email, Validators.maxLength(this.MAX_LENGTH_EMAIL)]],
      password: ['', [this.passwordValidator()]],
      phone:    ['', [Validators.pattern(PHONE_8_DIGITS)]]
    });
  }

  loadAdmins(page: number = 0, size: number = 20, search: string = '', sort?: string): void {
    this.isLoading.set(true);
    this.adminUserService.getByInstitution(this.institutionUuid, page, size, search, 'ADMIN', true, sort).subscribe({
      next: res => {
        this.admins = res.content;
        this.totalRecords = res.totalElements;
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastRef.showError('No se pudieron cargar los administradores', 'Error');
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

    this.loadAdmins(page, size, search, sort);
  }

  reloadAdmins(): void {
    if (this.lastLazyLoadEvent) {
      this.onLazyLoad(this.lastLazyLoadEvent);
    } else {
      this.loadAdmins(0, 10, '');
    }
  }

  openCreateDialog(): void {
    this.isEditMode.set(false);
    this.selectedUuid = null;
    this.form.reset();
    this.showDialog.set(true);
  }

  openEditDialog(admin: AdminUser): void {
    this.isEditMode.set(true);
    this.selectedUuid = admin.uuid;
    this.form.reset();
    this.form.patchValue({ name: admin.name, lastName: admin.lastName, email: admin.email, phone: admin.phone ?? '' });
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
            this.toastRef.showSuccess('Administrador creado exitosamente', 'Creado');
            this.showDialog.set(false);
            this.reloadAdmins();
          },
          error: err => this.toastRef.showError(err.error?.message ?? 'No se pudo crear el administrador', 'Error')
        });
    }
  }

  confirmDelete(admin: AdminUser): void {
    this.confirmationService.confirm({
      message: `¿Deshabilitar al administrador <strong>${admin.name} ${admin.lastName}</strong>?`,
      header: 'Confirmar deshabilitación',
      icon: 'fa-solid fa-user-slash',
      acceptLabel: 'Deshabilitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: 'fa-solid fa-user-slash me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => {
        this.adminUserService.disable(admin.uuid).subscribe({
          next: () => {
            this.toastRef.showSuccess('Administrador deshabilitado', 'Éxito');
            this.reloadAdmins();
          },
          error: () => this.toastRef.showError('No se pudo deshabilitar', 'Error')
        });
      }
    });
  }

  hasError(controlName: string, errorType: string) {
    const control = this.form.get(controlName);
    return control?.hasError(errorType) && control?.touched;
  }

  get dialogTitle(): string {
    return this.isEditMode() ? 'Editar administrador' : 'Nuevo administrador';
  }

  private passwordValidator(): ValidatorFn {
    return (control: AbstractControl): PasswordValidationErrors | null => {
      const value = control.value as string;

      // En modo editar, si está vacío es válido (no cambia password)
      if (!value && this.isEditMode()) return null;

      // En modo crear, si está vacío es requerido
      if (!value) return { required: true } as any;

      const errors: PasswordValidationErrors = {};

      const validations: Array<[keyof PasswordValidationErrors, boolean]> = [
        ['passwordLength', value.length < this.MIN_LENGTH_PASSWORD || value.length > this.MAX_LENGTH_PASSWORD],
        ['missingLowercase', !/[a-z]/.test(value)],
        ['missingUppercase', !/[A-Z]/.test(value)],
        ['missingNumber',    !/\d/.test(value)],
        ['missingSpecialChar', !/[!@#$%^&*()_+]/.test(value)],
      ];

      for (const [key, failed] of validations) {
        if (failed) errors[key] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }
}
