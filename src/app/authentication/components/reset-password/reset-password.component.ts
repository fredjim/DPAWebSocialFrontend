import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
  form!: FormGroup;
  token = '';
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.form = this.fb.group({
      newPassword: ['', [Validators.required, this.passwordLengthValidator()]],
      confirmPassword: ['', [Validators.required]]
    });
    this.form.valueChanges.subscribe(() => this.syncMatchError());
  }

  private passwordLengthValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const v = control.value as string;
      if (!v) return null;
      return v.length >= 8 && v.length <= 20 ? null : { passwordLength: true };
    };
  }

  private syncMatchError(): void {
    const np = this.form.get('newPassword')?.value;
    const cp = this.form.get('confirmPassword');
    if (cp?.value && np !== cp.value) {
      cp.setErrors({ mismatch: true });
    } else if (cp?.hasError('mismatch')) {
      cp.setErrors(null);
    }
  }

  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.token) return;

    this.isLoading = true;
    this.authService.resetPassword(this.token, this.form.value.newPassword).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'success',
          summary: 'Contraseña actualizada',
          detail: 'Tu contraseña fue actualizada correctamente. Inicia sesión.',
          life: 3500
        });
        setTimeout(() => this.router.navigate(['/', environment.DEFAULT_TENANT_SLUG]), 3500);
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'Ha ocurrido un error. Inténtalo de nuevo.',
          sticky: true
        });
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/', environment.DEFAULT_TENANT_SLUG]);
  }
}
