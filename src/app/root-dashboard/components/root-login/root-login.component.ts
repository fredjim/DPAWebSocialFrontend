import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { RootAuthService } from '../../services/root-auth.service';

@Component({
  selector: 'app-root-login',
  templateUrl: './root-login.component.html',
  styleUrl: './root-login.component.scss'
})
export class RootLoginComponent implements OnInit {

  form!: FormGroup;
  isLoading = false;
  showPassword = false;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly fb: FormBuilder,
    private readonly rootAuthService: RootAuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (this.rootAuthService.isRootFromToken()) {
      this.router.navigate(['/root/dashboard']);
    }
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const { email, password } = this.form.value;
    this.isLoading = true;

    this.rootAuthService.rootLogin(email, password)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: () => this.router.navigate(['/root/dashboard']),
        error: (err: HttpErrorResponse) => {
          const detail = err.error?.message ?? 'Credenciales inválidas o usuario no es ROOT';
          this.toastRef.showError(detail, 'Error');
        }
      });
  }

  hasError(control: string, error: string): boolean {
    const c = this.form.get(control);
    return !!(c?.hasError(error) && c.touched);
  }
}
