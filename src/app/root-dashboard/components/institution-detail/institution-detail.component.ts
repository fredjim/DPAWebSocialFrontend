import { Component, OnInit, signal, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { Institution } from '../../models/institution.model';
import { InstitutionAdminService } from '../../services/institution-admin.service';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

@Component({
  selector: 'app-institution-detail',
  templateUrl: './institution-detail.component.html',
  styleUrl: './institution-detail.component.scss'
})
export class InstitutionDetailComponent implements OnInit {

  uuid!: string;
  institution: Institution | null = null;
  form!: FormGroup;
  isLoading = signal(true);
  isSaving = signal(false);
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly fb: FormBuilder,
    private readonly institutionService: InstitutionAdminService
  ) {}

  ngOnInit(): void {
    this.uuid = this.route.snapshot.params['uuid'];
    this.buildForm();
    this.loadInstitution();
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

  private loadInstitution(): void {
    this.isLoading.set(true);
    this.institutionService.getById(this.uuid).subscribe({
      next: inst => {
        this.institution = inst;
        this.form.patchValue(inst);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.toastRef.showError('No se pudo cargar la institución', 'Error');
      }
    });
  }

  update(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const dto: Institution = {
      ...this.institution,
      ...this.form.value
    };

    this.isSaving.set(true);
    this.institutionService.update(dto)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: updated => {
          this.institution = updated;
          this.toastRef.showSuccess('Institución actualizada exitosamente', 'Guardado');
        },
        error: err => {
          const detail = err.error?.message ?? 'No se pudo actualizar la institución';
          this.toastRef.showError(detail, 'Error');
        }
      });
  }

  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c?.hasError(error) && c.touched);
  }
}
