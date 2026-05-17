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

  public readonly MIN_LENGTH_SLUG = 2;
  public readonly MAX_LENGTH_SLUG = 5;
  public readonly MIN_LENGTH_NAME = 3;
  public readonly MAX_LENGTH_NAME = 150;
  public readonly MIN_LENGTH_DESCRIPTION = 3;
  public readonly MAX_LENGTH_DESCRIPTION = 300;
  public readonly MIN_LENGTH_LOCATION = 3;
  public readonly MAX_LENGTH_LOCATION = 300;
  public readonly MIN_LENGTH_CATEGORY = 3;
  public readonly MAX_LENGTH_CATEGORY = 100;
  public readonly MAX_LENGTH_EMAIL = 50;
  public readonly MIN_LENGTH_PHONE = 7;
  public readonly MAX_LENGTH_PHONE = 15;
  public readonly MIN_LENGTH_URL = 3;
  public readonly MAX_LENGTH_URL = 80;

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
      slug:        ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_SLUG), Validators.maxLength(this.MAX_LENGTH_SLUG), Validators.pattern(SLUG_PATTERN)]],
      name:        ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_NAME), Validators.maxLength(this.MAX_LENGTH_NAME)]],
      description: ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_DESCRIPTION), Validators.maxLength(this.MAX_LENGTH_DESCRIPTION)]],
      location:    ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_LOCATION), Validators.maxLength(this.MAX_LENGTH_LOCATION)]],
      category:    ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_CATEGORY), Validators.maxLength(this.MAX_LENGTH_CATEGORY)]],
      email:       ['', [Validators.required, Validators.email, Validators.maxLength(this.MAX_LENGTH_EMAIL)]],
      phone:       ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_PHONE), Validators.maxLength(this.MAX_LENGTH_PHONE)]],
      url:         ['', [Validators.required, Validators.minLength(this.MIN_LENGTH_URL), Validators.maxLength(this.MAX_LENGTH_URL)]]
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
