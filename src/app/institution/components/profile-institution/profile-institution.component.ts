import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { PostService } from '../../../posts/services/post.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { TenantService } from '../../../services/tenant.service';
import { InstitutionService } from '../../services/institution.service';
import { forkJoin, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../../posts/models/uploaded-media';
import { FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile-institution',
  templateUrl: './profile-institution.component.html',
  styleUrl: './profile-institution.component.scss'
})
export class ProfileInstitutionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly postService = inject(PostService);
  private readonly authService = inject(AuthService);
  private readonly institutionService = inject(InstitutionService);
  private readonly tenantService = inject(TenantService);

  currentUser!: UserDetail;
  institution!: Institution;
  authenticated: boolean = false;
  isMobileMenuOpen = false;
  isMenuOpen = false;
  imageFileCoverToCreate?: File;
  imageFileLogoToCreate?: File;
  imageCover: string = '';
  imageLogo: string = '';
  currentLogoUuid: string = '';
  currentBackgroundUuid: string = '';
  currentSlug: string = '';

  @ViewChild('fileInputCover') fileInputCover!: ElementRef;
  @ViewChild('fileInputLogo') fileInputLogo!: ElementRef;
  @ViewChild('toast') toast!: CustomToastComponent;

  formInstitution!: FormGroup;

  ngOnInit(): void {
    this.currentSlug = this.tenantService.getSlug();
    this.initForm();
    this.authenticated = this.authService.isAuthenticated();
    if(this.authenticated){
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
        });
    }

    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe(institutionData => {
        this.institution = institutionData;
        this.imageCover = institutionData.background_url || '';
        this.imageLogo = institutionData.logo_url || '';
        this.currentLogoUuid = this.extractUuidFromUrl(institutionData.logo_url);
        this.currentBackgroundUuid = this.extractUuidFromUrl(institutionData.background_url);
        this.formInstitution.patchValue({
          name: institutionData.name,
          description: institutionData.description,
          location: institutionData.location,
          email: institutionData.email,
          phone: institutionData.phone,
          url: institutionData.url,
        });
      });
  }

  private initForm(): void {
    this.formInstitution = new FormGroup({
      name: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]),
      description: new FormControl(),
      location: new FormControl(),
      email: new FormControl('', [Validators.email]),
      phone: new FormControl(),
      url: new FormControl(),
    });
  }

  onSubmit(): void {
    if (this.formInstitution.invalid) return;

    this.toast.showInfo('Guardando cambios...', 'Procesando');
    
    const uploadLogo$: Observable<UploadedMedia | null> = this.imageFileLogoToCreate 
      ? this.institutionService.postInstitutionPhotoProfile(this.createFormData(this.imageFileLogoToCreate))
      : of(null);

    const uploadCover$: Observable<UploadedMedia | null> = this.imageFileCoverToCreate
      ? this.institutionService.postInstitutionPhotoCover(this.createFormData(this.imageFileCoverToCreate))
      : of(null);

    forkJoin([uploadLogo$, uploadCover$]).pipe(
      switchMap(([logoMedia, coverMedia]) => {
        if (logoMedia) this.currentLogoUuid = logoMedia.uuid;
        if (coverMedia) this.currentBackgroundUuid = coverMedia.uuid;

        return this.institutionService.updateInstitutionData({
          ...this.institution,
          ...this.formInstitution.value,
          logoFileUuid: this.currentLogoUuid,
          backgroundFileUuid: this.currentBackgroundUuid,
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (institution: Institution) => {
        this.institution = institution;
        this.imageFileLogoToCreate = undefined;
        this.imageFileCoverToCreate = undefined;
        this.toast.showSuccess('Información de la institución actualizada correctamente');
      },
      error: (error) => {
        console.error('Error updating institution:', error);
        this.toast.showError('Hubo un error al actualizar la información');
      }
    });
  }

  private createFormData(file: File): FormData {
    const formData = new FormData();
    formData.append('image', file);
    return formData;
  }



  public openInputFileCover(): void {
    this.resetFileInput(this.fileInputCover);
    this.fileInputCover?.nativeElement.click();  
  }

  public openInputFileLogo(): void {
    this.resetFileInput(this.fileInputLogo);
    this.fileInputLogo?.nativeElement.click();  
  }

  private resetFileInput(fileInput: ElementRef): void {
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = '';
    }
  }

  changeInputMediaCover(event: Event){
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFileCoverToCreate = event.target.files[0];

      // Validaciones
      if(!this.isValidFileType(this.imageFileCoverToCreate)){
        this.toast.showError('Por favor, seleccione una imagen válida');
        this.resetFileInput(this.fileInputCover);
        return;
      }

      // Preview local
      const reader = new FileReader();
      reader.onload = () => {
        this.imageCover = reader.result as string;
      };
      reader.readAsDataURL(this.imageFileCoverToCreate);
    }
  }

  changeInputMediaLogo(event: Event){
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFileLogoToCreate = event.target.files[0];
      // Validaciones
      if(!this.isValidFileType(this.imageFileLogoToCreate)){
        this.toast.showError('Por favor, seleccione una imagen válida');
        this.resetFileInput(this.fileInputLogo);
        return;
      }

      // Preview local
      const reader = new FileReader();
      reader.onload = () => {
        this.imageLogo = reader.result as string;
      };
      reader.readAsDataURL(this.imageFileLogoToCreate);
    }
  }

  private extractUuidFromUrl(url: string): string {
    return url ? url.split('/').pop() ?? '' : '';
  }

  get institutionLogoUrl(): string {
    return this.imageLogo || this.institution?.logo_url || '';
  }

  get institutionCoverUrl(): string {
    return this.imageCover || this.institution?.background_url || '';
  }

  get hasInstitutionCover(): boolean {
    return !!this.institutionCoverUrl && this.institutionCoverUrl.trim().length > 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isValidFileType(file: File): boolean {
    return file.type.startsWith('image/');
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
