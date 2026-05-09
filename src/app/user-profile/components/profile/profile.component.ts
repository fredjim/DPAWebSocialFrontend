import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { PostService } from '../../../posts/services/post.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { TenantService } from '../../../services/tenant.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../../posts/models/uploaded-media';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly postService = inject(PostService);
  private readonly authService = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly tenantService = inject(TenantService);

  currentUser!: UserDetail;
  institution!: Institution;
  authenticated: boolean = false;
  currentSlug: string = '';
  isMobileMenuOpen = false;
  isMenuOpen = false;
  isLoading = false;
  formUser!: FormGroup;

  imageFileProfileToCreate?: File;
  imageProfile = '';
  currentPhotoUuid: string = '';
  @ViewChild('fileInputProfile') fileInputProfile!: ElementRef;
  @ViewChild('toast') toast!: CustomToastComponent;

  ngOnInit(): void {
    this.currentSlug = this.tenantService.getSlug();
    this.initForm();

    this.authenticated = this.authService.isAuthenticated();
    if(this.authenticated){
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
          this.currentPhotoUuid = this.extractUuidFromUrl(user.photo_profile_path);
          this.formUser.patchValue({
            name: this.currentUser.name,
            lastName: this.currentUser.lastName,
            phone: this.currentUser.phone,
          });
        });
    }

    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe(institutionData =>{
        this.institution = institutionData;
      });
  }

  onSubmit(): void {
    if (!this.currentUser || this.formUser.invalid) return;

    this.isLoading = true;
    this.toast.showInfo('Guardando cambios...', 'Procesando');

    const upload$: Observable<UploadedMedia | null> = this.imageFileProfileToCreate
      ? this.userService.postUserPhotoProfile(this.createFormData(this.imageFileProfileToCreate))
      : of(null);

    upload$.pipe(
      switchMap((uploadedMedia) => {
        const updateData: any = {
          ...this.formUser.value,
          photoProfileFileUuid: uploadedMedia ? uploadedMedia.uuid : this.currentPhotoUuid
        };

        return this.userService.updateUserDate(updateData);
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (userData: UserDetail) => {
        this.isLoading = false;
        this.currentUser = userData;
        this.currentPhotoUuid = this.extractUuidFromUrl(userData.photo_profile_path);
        this.imageFileProfileToCreate = undefined;
        this.toast.showSuccess('Perfil actualizado correctamente');
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al editar usuario', error);
        this.toast.showError('Hubo un error al actualizar el perfil');
      }
    });
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
        this.imageProfile = reader.result as string;
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

  private extractUuidFromUrl(url: string | null | undefined): string {
    if (!url) return '';
    const parts = url.split('/');
    return parts.pop() || '';
  }

  private initForm(): void {
    this.formUser = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.maxLength(50), this.onlyLettersValidator()]),
      lastName: new FormControl('', [Validators.required, Validators.maxLength(80), this.onlyLettersValidator()]),
      phone: new FormControl('', [Validators.maxLength(15), this.numbersOnlyValidator()]),
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
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
}
