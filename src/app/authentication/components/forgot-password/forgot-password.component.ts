import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  visible = false;
  isLoading = false;
  sent = false;
  form: FormGroup;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  show(): void {
    this.form.reset();
    this.sent = false;
    this.visible = true;
  }

  close(): void {
    this.visible = false;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    this.isLoading = true;
    this.authService.forgotPassword(this.form.value.email).subscribe({
      next: () => {
        this.isLoading = false;
        this.sent = true;
      },
      error: () => {
        // La API siempre retorna 200; en caso de error inesperado mostramos el mismo mensaje
        this.isLoading = false;
        this.sent = true;
      }
    });
  }

  hasError(field: string, error: string): boolean {
    const c = this.form.get(field);
    return !!(c?.hasError(error) && c?.touched);
  }
}
