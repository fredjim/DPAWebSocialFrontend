import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { NewUser } from '../../models/new-user';
import { MessageService } from 'primeng/api';
import { Modal } from 'bootstrap';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

interface PasswordValidationErrors {
  passwordLength?: true;
  missingLowercase?: true;
  missingUppercase?: true;
  missingNumber?: true;
  missingSpecialChar?: true;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService]
})
export class RegisterComponent implements OnInit {
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  public registerForm!: FormGroup;
  public hide = true;
  public confirmHide = true;
  public inputType: string = 'password';
  public confirmInputType: string = 'password';
  public passwordMismatch: boolean = false;
  public isRegistering: boolean = false;

  public readonly MAX_LENGTH_NAME = 50;
  public readonly MAX_LENGTH_LASTNAME = 80;
  public readonly MAX_LENGTH_EMAIL = 50;
  public readonly MAX_LENGTH_PASSWORD = 16;
  public readonly MIN_LENGTH_PASSWORD = 8;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.buildForm();
  }

  private onlyLettersValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
      return lettersRegex.test(control.value) ? null : { 'onlyLetters': true };
    };
  }

  private passwordValidator(): ValidatorFn {
    return (control: AbstractControl): PasswordValidationErrors | null => {
      const value = control.value as string;

      if (!value) return null;

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

  private buildForm() {
    this.registerForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(this.MAX_LENGTH_NAME), this.onlyLettersValidator()]],
      lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(this.MAX_LENGTH_LASTNAME), this.onlyLettersValidator()]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(this.MAX_LENGTH_EMAIL)]],
      password: ['', [Validators.required, this.passwordValidator()]],
      repeat_password: ['', [Validators.required]]
    });

    this.registerForm.valueChanges.subscribe(() => this.checkPasswordMatch());
  }

  private checkPasswordMatch() {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('repeat_password')?.value;
    this.passwordMismatch = password !== confirmPassword && confirmPassword !== '';
  }

  register() {
    this.registerForm.markAllAsTouched();
    if (!this.registerForm.valid || this.passwordMismatch) return;

    const newUser: NewUser = this.registerForm.value;
    this.isRegistering = true;

    this.authService.register(newUser)
      .pipe(finalize(() => this.isRegistering = false))
      .subscribe({
        next: () => {
          this.resetForm();
          this.closeModalRegister();
          this.toastRef.showSuccess(
            'Te enviamos un email para verificar tu cuenta. Revisa tu bandeja de entrada antes de iniciar sesión.',
            'Registro exitoso',
            6000
          );
        },
        error: (error: HttpErrorResponse) => {
          console.error('Error al registrar', error);

          const backendMessage = error?.error?.message || error?.error?.detail || '';

          if (backendMessage.includes('The user email is already registered')) {
            const emailControl = this.registerForm.get('email');
            if (emailControl) {
              emailControl.setErrors({ backend: 'Este correo ya está registrado' });
              emailControl.markAsTouched();
            }
            this.toastRef.showError('El correo ya está registrado.', 'Error al registrar', 5000);
          } else {
            this.toastRef.showError('Inténtelo más tarde.', 'Error al registrar', 5000);
          }

          if (error?.error?.errors) {
            const fieldErrors = error.error.errors;
            Object.keys(fieldErrors).forEach(field => {
              const control = this.registerForm.get(field);
              if (control) {
                control.setErrors({ backend: fieldErrors[field][0] });
                control.markAsTouched();
              }
            });
          }
        }
      });
  }

  hasErrors(controlName: string, errorType: string) {
    const control = this.registerForm.get(controlName);
    return control?.hasError(errorType) && control?.touched;
  }

  hasCustomError(controlName: string, errorType: string) {
    const control = this.registerForm.get(controlName);
    return control?.hasError(errorType) && control?.touched;
  }

  hasBackendError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control?.errors?.['backend'];
  }

  getBackendError(controlName: string): string {
    const control = this.registerForm.get(controlName);
    return control?.errors?.['backend'] || '';
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
    this.inputType = this.hide ? 'password' : 'text';
  }

  toggleConfirmPasswordVisibility() {
    this.confirmHide = !this.confirmHide;
    this.confirmInputType = this.confirmHide ? 'password' : 'text';
  }

  resetForm() {
    this.registerForm.reset();
    this.passwordMismatch = false;
    this.hide = true;
    this.confirmHide = true;
    this.inputType = 'password';
    this.confirmInputType = 'password';
  }

  closeModalRegister() {
    const modalRegister = document.getElementById('registerModal') as HTMLElement;
    const modal = Modal.getInstance(modalRegister);
    modal?.hide();
    setTimeout(() => {
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) backdrop.remove();
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }, 300);
  }

  showModalLogin() {
    const modalLogin = document.getElementById('loginModal') as HTMLElement;
    const modal = new Modal(modalLogin);
    modal?.show();
  }
}
