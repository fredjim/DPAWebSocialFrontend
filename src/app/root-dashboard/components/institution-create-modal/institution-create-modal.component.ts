import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { Institution } from '../../models/institution.model';
import { InstitutionAdminService } from '../../services/institution-admin.service';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-institution-create-modal',
  templateUrl: './institution-create-modal.component.html',
  styleUrl: './institution-create-modal.component.scss'
})
export class InstitutionCreateModalComponent implements OnInit {

  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() saved = new EventEmitter<Institution>();

  form!: FormGroup;
  isSaving = false;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly fb: FormBuilder,
    private readonly institutionService: InstitutionAdminService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      slug:        ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100), Validators.pattern(SLUG_PATTERN)]],
      name:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
      description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
      location:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(300)]],
      category:    ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      email:       ['', [Validators.required, Validators.email, Validators.maxLength(50)]],
      phone:       ['', [Validators.required, Validators.minLength(7), Validators.maxLength(15)]],
      url:         ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]]
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const dto: Institution = {
      ...this.form.value,
      logo_url: '/placeholder',
      background_url: '/placeholder'
    };

    this.isSaving = true;
    this.institutionService.create(dto)
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: inst => {
          this.toastRef.showSuccess(`Institución "${inst.name}" creada exitosamente`, 'Creada');
          this.saved.emit(inst);
          this.close();
        },
        error: err => {
          const detail = err.error?.message ?? 'No se pudo crear la institución';
          this.toastRef.showError(detail, 'Error');
        }
      });
  }

  close(): void {
    this.form.reset();
    this.visibleChange.emit(false);
  }

  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c?.hasError(error) && c.touched);
  }
}
