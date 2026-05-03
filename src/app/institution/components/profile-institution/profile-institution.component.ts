import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { PostService } from '../../../posts/services/post.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { TenantService } from '../../../services/tenant.service';
import { InstitutionService } from '../../services/institution.service';
import { Subject, takeUntil } from 'rxjs';
import { switchMap } from 'rxjs/operators';
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
  imageFileCoverToCreate!: File;
  imageFileLogoToCreate!: File;
  imageCover: string = '';
  imageLogo: string = '';

  @ViewChild('fileInputCover') fileInputCover!: ElementRef;
  @ViewChild('fileInputLogo') fileInputLogo!: ElementRef;

  formInstitution!: FormGroup;

  ngOnInit(): void {
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
      .subscribe(institutionData =>{
        this.institution = institutionData;
      this.imageCover = this.institution.background_url || '';
      this.imageLogo = this.institution.logo_url || '';
      this.formInstitution.patchValue({
        name: this.institution.name,
        description: this.institution.description,
        location: this.institution.location,
        email: this.institution.email,
        phone: this.institution.phone,
        url: this.institution.url,
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
    if (this.formInstitution.valid) {
      const updatedInstitution: Institution = {
        ...this.institution,
        ...this.formInstitution.value
      };
      this.institutionService.updateInstitutionData(updatedInstitution)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (institution: Institution) => {
            this.institution = institution;
          },
          error: (error) => {
            console.error('Error updating institution:', error);
          }
        });
    }
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
        alert('Por favor, seleccione una imagen');
        this.resetFileInput(this.fileInputCover);
        return;
      }

      const formData = new FormData();
      formData.append('image', this.imageFileCoverToCreate);
      if (!this.institution) {
        console.error('No institution data available to update.');
        return;
      }
      // Upload image and then update the institution background_url
      this.institutionService.postInstitutionPhotoCover(formData).pipe(
        switchMap((uploadedMedia: UploadedMedia[]) => {
          const backgroundUrl = uploadedMedia[0].urlResource;
          const updatedInstitution: Institution = { ...this.institution, background_url: backgroundUrl } as Institution;
          return this.institutionService.updateInstitutionData(updatedInstitution);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedInstitution: Institution) => {
          this.institution = updatedInstitution;
          this.imageCover = updatedInstitution.background_url || '';
          console.log('Imagen de portada subida y institución actualizada:', updatedInstitution);
        },
        error: (error) => {
          console.error('Error al subir la imagen de portada o actualizar la institución:', error);
        }
      });
      
    }
  }

  changeInputMediaLogo(event: Event){
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFileLogoToCreate = event.target.files[0];
      // Validaciones
      if(!this.isValidFileType(this.imageFileLogoToCreate)){
        alert('Por favor, seleccione una imagen');
        this.resetFileInput(this.fileInputLogo);
        return;
      }

      const formData = new FormData();
      formData.append('image', this.imageFileLogoToCreate);
      // Ensure we have institution loaded before updating
      if (!this.institution) {
        console.error('No institution data available to update.');
        return;
      }
      // Upload image and then update the institution logo_url
      this.institutionService.postInstitutionPhotoProfile(formData).pipe(
        switchMap((uploadedMedia: UploadedMedia[]) => {
          const logoUrl = uploadedMedia[0].urlResource;
          const updatedInstitution: Institution = { ...this.institution, logo_url: logoUrl } as Institution;
          return this.institutionService.updateInstitutionData(updatedInstitution);
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (updatedInstitution: Institution) => {
          this.institution = updatedInstitution;
          this.imageLogo = updatedInstitution.logo_url || '';
        },
        error: (error) => {
          console.error('Error al subir la imagen de logo o actualizar la institución:', error);
        }
      });
    }
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
