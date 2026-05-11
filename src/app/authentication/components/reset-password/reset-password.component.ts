import { Component, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../../environments/environment';
import { finalize } from 'rxjs';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  providers: [MessageService]
})
export class ResetPasswordComponent implements OnInit {
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  form!: FormGroup;
  token = '';
  isLoading = false;

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService
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

    this.authService.resetPassword(this.token, this.form.value.newPassword)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => {
          this.toastRef.showSuccess(
            'Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.',
            'Contraseña actualizada',
            4000
          );
          setTimeout(() => this.router.navigate(['/', environment.DEFAULT_TENANT_SLUG]), 4000);
        },
        error: (err) => {
          this.toastRef.showError(
            err?.error?.message || 'Ha ocurrido un error. Inténtalo de nuevo.',
            'Error al actualizar',
            5000
          );
        }
      });
  }

  goHome(): void {
    this.router.navigate(['/', environment.DEFAULT_TENANT_SLUG]);
  }
}
