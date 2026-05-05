import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { PostService } from '../../../posts/services/post.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { TenantService } from '../../../services/tenant.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
      name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]),
      lastName: new FormControl(),
      phone: new FormControl(),
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
}
