import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ForgotPasswordComponent } from '../forgot-password/forgot-password.component';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  public loginForm!: FormGroup;
  public hide = true;
  public inputType: string = 'password';
  public errorMessage!: string;
  @ViewChild('userFocus', { static: true })
  public usernameField!: ElementRef;
  @ViewChild('forgotPasswordRef')
  public forgotPasswordComp!: ForgotPasswordComponent;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;
  public correctCredentials: boolean = true;
  public credentialsAnotherInstitution = false;
  public emailNotVerified = false;
  public isLoggedIn = false;
  public isLoading = false;
  private currentSlug: string = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly tenantService: TenantService
  ) { }

  ngOnInit(): void {
    this.currentSlug = this.tenantService.getSlug();
    this.buildForm();
  }

  private buildForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  login() {
    this.loginForm.markAllAsTouched();
    let dataValid = this.loginForm.valid
    if(dataValid){
      let login = this.loginForm.value;

      this.isLoading = true;
      this.auth.login(login.username, login.password)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
        next: () => {
          this.isLoggedIn = true;
          this.router.navigate([`/${this.currentSlug}`]);
          globalThis.location.reload();
        },
        error: (error: HttpErrorResponse) => {
          console.log('Error al iniciar sesión', error);
          const msg: string = error?.error?.message ?? '';
          if (msg === 'Debes verificar tu email antes de iniciar sesión.') {
            this.emailNotVerified = true;
            this.toastRef.showWarn('Revisa tu bandeja de entrada y verifica tu email para poder iniciar sesión.', 'Email no verificado');
          } else if (error.status === 400 && msg.includes('El usuario no pertenece a esta institución.')) {
            this.credentialsAnotherInstitution = true;
            this.toastRef.showError('El usuario no pertenece a esta institución', 'Error al iniciar sesión');
          } else if (error.status === 401) {
            this.correctCredentials = false;
          } else if (error.status === 403) {
            this.toastRef.showError('La cuenta está deshabilitada. Contacta al administrador.', 'Error al iniciar sesión');
          }
        }
      });
    }

  }

  hasErrors(controlName:string, errorType: string){
    return this.loginForm.get(controlName)?.hasError(errorType) && this.loginForm.get(controlName)?.touched;
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
    this.inputType = this.inputType === 'password' ? 'text' : 'password';
  }

  loginReset(){
    this.loginForm.reset();
    this.correctCredentials = true;
    this.credentialsAnotherInstitution = false;
    this.emailNotVerified = false;
  }

  openForgotPassword(): void {
    this.loginForm.reset();
    this.forgotPasswordComp?.show();
  }

}
