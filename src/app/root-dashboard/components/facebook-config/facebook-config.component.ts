import { Component, Input, OnInit, signal, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConfirmationService } from 'primeng/api';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { FacebookConfig } from '../../models/facebook-config.model';
import { FacebookConfigService } from '../../services/facebook-config.service';

@Component({
  selector: 'app-facebook-config',
  templateUrl: './facebook-config.component.html',
  styleUrl: './facebook-config.component.scss'
})
export class FacebookConfigComponent implements OnInit {

  @Input({ required: true }) institutionUuid!: string;

  config: FacebookConfig | null = null;
  form!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly fb: FormBuilder,
    private readonly fbConfigService: FacebookConfigService,
    private readonly confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      page_id:      ['', [Validators.required, Validators.maxLength(50)]],
      access_token: ['', [Validators.required]]
    });
    this.loadConfig();
  }

  loadConfig(): void {
    this.isLoading.set(true);
    this.fbConfigService.get(this.institutionUuid)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: cfg => {
          this.config = cfg;
          if (cfg.configured) {
            this.form.patchValue({ page_id: cfg.page_id ?? '' });
          }
        },
        error: () => this.toastRef.showError('No se pudo cargar la configuración', 'Error')
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isSaving.set(true);
    this.fbConfigService.save(this.institutionUuid, this.form.value)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: cfg => {
          this.config = cfg;
          this.form.patchValue({ page_id: cfg.page_id ?? '', access_token: '' });
          this.toastRef.showSuccess('Configuración de Facebook guardada', 'Guardado');
        },
        error: err => this.toastRef.showError(err.error?.message ?? 'No se pudo guardar', 'Error')
      });
  }

  disable(): void {
    this.confirmationService.confirm({
      message: '¿Desea deshabilitar la integración con Facebook? La configuración se conservará.',
      header: 'Deshabilitar integración',
      icon: 'fa-solid fa-circle-pause',
      acceptLabel: 'Deshabilitar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-warning p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: 'fa-solid fa-ban me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => {
        this.fbConfigService.disable(this.institutionUuid).subscribe({
          next: cfg => {
            this.config = cfg;
            this.toastRef.showWarn('Integración con Facebook deshabilitada', 'Deshabilitado');
          },
          error: () => this.toastRef.showError('No se pudo deshabilitar', 'Error')
        });
      }
    });
  }

  confirmDelete(): void {
    this.confirmationService.confirm({
      message: '¿Desea eliminar completamente la configuración de Facebook? Deberá volver a configurarla.',
      header: 'Eliminar configuración',
      icon: 'fa-solid fa-trash-can',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger p-button-sm',
      rejectButtonStyleClass: 'p-button-secondary p-button-sm',
      acceptIcon: 'fa-solid fa-trash-can me-2',
      rejectIcon: 'fa-solid fa-xmark me-2',
      accept: () => {
        this.fbConfigService.delete(this.institutionUuid).subscribe({
          next: () => {
            this.config = null;
            this.form.reset();
            this.toastRef.showSuccess('Configuración eliminada', 'Eliminado');
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
}
