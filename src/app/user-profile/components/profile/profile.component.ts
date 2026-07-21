import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { UserDetail } from '../../../shared/models/user-detail';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { from, map, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../../shared/models/uploaded-media';
import { ImageOptimizationService } from '../../../shared/services/image-optimization.service';

type PhotoAction =
  | { type: 'upload'; media: UploadedMedia }
  | { type: 'delete' }
  | { type: 'none' };

interface PasswordValidationErrors {
  passwordLength?: true;
  missingLowercase?: true;
  missingUppercase?: true;
  missingNumber?: true;
  missingSpecialChar?: true;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly tenantService = inject(TenantService);
  private readonly imageOptimizationService = inject(ImageOptimizationService);

  public readonly MAX_NAME_LENGTH = 50;
  public readonly MAX_LASTNAME_LENGTH = 80;
  public readonly MIN_PHONE_LENGTH = 7;
  public readonly MAX_PHONE_LENGTH = 15;
  public readonly MAX_LENGTH_PASSWORD = 16;
  public readonly MIN_LENGTH_PASSWORD = 8;

  currentUser!: UserDetail;
  authenticated: boolean = false;
  currentSlug: string = '';
  isLoading = false;
  formUser!: FormGroup;
  hidePassword = true;
  typeInputPassword: 'password' | 'text' = 'password';

  imageFileProfileToCreate?: File;
  imageProfilePreview = '';
  photoProfileMarkedForDeletion = false;
  @ViewChild('fileInputProfile') fileInputProfile!: ElementRef;
  @ViewChild('toast') toast!: CustomToastComponent;

  ngOnInit(): void {
    this.currentSlug = this.tenantService.getSlug();
    this.initForm();

    this.authenticated = this.authService.isAuthenticated();
    if(this.authenticated){
      this.userService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
          this.formUser.patchValue({
            name: this.currentUser.name,
            lastName: this.currentUser.lastName,
            phone: this.currentUser.phone,
          });
        });
    }
  }

  onSubmit(): void {
    if (!this.currentUser || this.formUser.invalid) return;
    this.isLoading = true;
    this.toast.showInfo('Guardando cambios...', 'Procesando');

    let photoAction$: Observable<PhotoAction>;

    if (this.imageFileProfileToCreate) {
      photoAction$ = from(this.imageOptimizationService.optimizeImages([this.imageFileProfileToCreate])).pipe(
        switchMap((optimizedFiles) =>
          this.userService.postUserPhotoProfile(this.createFormData(optimizedFiles[0]))
        ),
        map((media) => ({ type: 'upload', media } as PhotoAction))
      );
    } else if (this.photoProfileMarkedForDeletion && this.currentUser.photoProfileFileUuid) {
      photoAction$ = this.userService.deleteUserPhotoProfile(this.currentUser.photoProfileFileUuid).pipe(
        map(() => ({ type: 'delete' } as PhotoAction))
      );
    } else {
      photoAction$ = of({ type: 'none' } as PhotoAction);
    }

    photoAction$.pipe(
      switchMap((action) => {
        let photoProfileFileUuid: string | null;

        switch (action.type) {
          case 'upload':
            photoProfileFileUuid = action.media.uuid; // cuando se crea o reemplaza la img
            break;
          case 'delete':
            photoProfileFileUuid = null; // cuando se borra la img
            break;
          case 'none':
            photoProfileFileUuid = this.currentUser!.photoProfileFileUuid; // sin cambios
            break;
        }

        // Verificar valor de password para para actualizarlo o no
        let password = this.formUser.get('password')?.value;
        if(password.trim() === ''){
          password = null;
        }

        const updateData: UserDetail = {
          ...this.currentUser,
          ...this.formUser.value,
          password,
          photoProfileFileUuid
        };

        return this.userService.updateUserDate(updateData);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (userData: UserDetail) => {
        this.isLoading = false;
        this.currentUser = userData;
        this.formUser.get('password')?.setValue('');
        this.imageFileProfileToCreate = undefined;
        this.photoProfileMarkedForDeletion = false;
        this.toast.showSuccess('Perfil actualizado correctamente');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al editar usuario', error);
        this.toast.showError('Hubo un error al actualizar el perfil');
      }
    });
  }

  onDeletePhotoProfile(): void {
    this.currentUser.photo_profile_path = null;
    this.imageFileProfileToCreate = undefined;
    this.photoProfileMarkedForDeletion = true;
  }

  private createFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('image', file);
    return formData;
  }

  changeInputMediaProfile(event: Event): void {
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFileProfileToCreate = event.target.files[0];
      // Validaciones
      if(!this.isValidFileType(this.imageFileProfileToCreate)){
        this.toast.showError('Por favor, seleccione una imagen válida');
        this.resetFileInput(this.fileInputProfile);
        return;
      }

      // Preview local
      const reader = new FileReader();
      reader.onload = () => {
        this.imageProfilePreview = reader.result as string;
      };
      reader.readAsDataURL(this.imageFileProfileToCreate);
    }
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isValidFileType(file: File): boolean {
    return file.type.startsWith('image/');
  }

  public openInputFileProfile(): void {
    this.resetFileInput(this.fileInputProfile);
    this.fileInputProfile?.nativeElement.click();  
  }

  private resetFileInput(fileInput: ElementRef): void {
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = '';
    }
  }

  private initForm(): void {
    this.formUser = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_NAME_LENGTH), this.onlyLettersValidator()]),
      lastName: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_LASTNAME_LENGTH), this.onlyLettersValidator()]),
      phone: new FormControl('', [Validators.maxLength(this.MAX_PHONE_LENGTH), Validators.minLength(this.MIN_PHONE_LENGTH), this.numbersOnlyValidator()]),
      password: new FormControl('', [this.passwordValidator()])
    });
  }

  private numbersOnlyValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      
      if (!value) return null; // El campo es opcional, si está vacío no hay error
      
      // Verificar que solo contenga números
      const numbersOnlyRegex = /^\d+$/;
      if (!numbersOnlyRegex.test(value)) {
        return { 'numbersOnly': true };
      }
      
      return null;
    };
  }

  private onlyLettersValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (!control.value) return null;
      const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
      return lettersRegex.test(control.value) ? null : { 'onlyLetters': true };
    };
  }

  // Método helper para verificar errores en los campos
  hasError(controlName: string, errorName: string): boolean {
    const control = this.formUser.get(controlName);
    if (!control) return false;
    return control.touched && control.hasError(errorName);
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

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
    this.typeInputPassword = this.hidePassword ? 'password' : 'text';
  }
}
