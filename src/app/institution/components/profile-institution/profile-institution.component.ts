import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { Institution } from '../../../shared/models/institution';
import { InstitutionService } from '../../services/institution.service';
import { forkJoin, from, Observable, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../../shared/models/uploaded-media';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { OwnInstitutionStateService } from '../../../core/services/own-institution-state.service';
import { ImageOptimizationService } from '../../../shared/services/image-optimization.service';

@Component({
  selector: 'app-profile-institution',
  templateUrl: './profile-institution.component.html',
  styleUrl: './profile-institution.component.scss'
})
export class ProfileInstitutionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly institutionService = inject(InstitutionService);
  private readonly ownInstitutionStateService = inject(OwnInstitutionStateService);
  private readonly imageOptimizationService = inject(ImageOptimizationService);

  public readonly MAX_NAME_LENGTH = 150;
  public readonly MAX_DESCRIPTION_LENGTH = 300;
  public readonly MAX_LOCATION_LENGTH = 300;
  public readonly MAX_EMAIL_LENGTH = 80;
  public readonly MAX_PHONE_LENGTH = 20;
  public readonly MAX_URL_LENGTH = 80;

  institution: Institution | null = null;
  imageFileCoverToCreate?: File;
  imageFileLogoToCreate?: File;
  imageCover: string = '';
  imageLogo: string = '';
  currentLogoUuid: string = '';
  currentBackgroundUuid: string = '';

  @ViewChild('fileInputCover') fileInputCover!: ElementRef;
  @ViewChild('fileInputLogo') fileInputLogo!: ElementRef;
  @ViewChild('toast') toast!: CustomToastComponent;

  formInstitution!: FormGroup;

  ngOnInit(): void {
    this.initForm();

    this.ownInstitutionStateService.ownInstitution$
      .pipe(takeUntil(this.destroy$))
      .subscribe(institutionData => {
        if(!institutionData) return;
        this.institution = institutionData;
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
      name: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_NAME_LENGTH)]),
      description: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_DESCRIPTION_LENGTH)]),
      location: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_LOCATION_LENGTH)]),
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(this.MAX_EMAIL_LENGTH)]),
      phone: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_PHONE_LENGTH), this.phoneValidator()]),
      url: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_URL_LENGTH), this.urlValidator()]),
    });
  }

  onSubmit(): void {
    if (!this.institution || this.formInstitution.invalid) return;

    this.toast.showInfo('Guardando cambios...', 'Procesando');
    
    const uploadLogo$: Observable<UploadedMedia | null> = this.imageFileLogoToCreate
      ? from(this.imageOptimizationService.optimizeImages([this.imageFileLogoToCreate])).pipe(
          switchMap((optimizedFiles) =>
            this.institutionService.postInstitutionPhotoProfile(this.createFormData(optimizedFiles[0]))
          )
        )
      : of(null);

    const uploadCover$: Observable<UploadedMedia | null> = this.imageFileCoverToCreate
      ? from(this.imageOptimizationService.optimizeImages([this.imageFileCoverToCreate])).pipe(
          switchMap((optimizedFiles) =>
            this.institutionService.postInstitutionPhotoCover(this.createFormData(optimizedFiles[0]))
          )
        )
      : of(null);

    forkJoin([uploadLogo$, uploadCover$]).pipe(
      switchMap(([logoMedia, coverMedia]) => {
        if (logoMedia) this.currentLogoUuid = logoMedia.uuid;
        if (coverMedia) this.currentBackgroundUuid = coverMedia.uuid;

        return this.ownInstitutionStateService.updateOwnInstitution({
          ...this.institution,
          ...this.formInstitution.value,
          logoFileUuid: this.currentLogoUuid,
          backgroundFileUuid: this.currentBackgroundUuid,
        });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: () => {
        // this.institution ya no hace falta asignarlo aquí manualmente:
        // la suscripción a ownInstitution$ en ngOnInit lo recibe automáticamente
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
        this.coverImageError = false;
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

  coverImageError = false;

  get institutionCoverUrl(): string {
    return this.imageCover || this.institution?.background_url || '';
  }

  get hasInstitutionCover(): boolean {
    return !!this.institutionCoverUrl && 
           this.institutionCoverUrl.trim().length > 0 && 
           this.institutionCoverUrl !== 'null' && 
           !this.coverImageError;
  }

  onCoverError() {
    this.coverImageError = true;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private isValidFileType(file: File): boolean {
    return file.type.startsWith('image/');
  }

  private phoneValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null;
      
      // Solo números, espacios y guiones
      const phoneRegex = /^[\d\s\-+]+$/;
      if (!phoneRegex.test(value)) {
        return { 'invalidPhone': true };
      }
      return null;
    };
  }

  private urlValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const value = control.value;
      if (!value) return null;
      
      // URL válida (http, https, o sin protocolo)
      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlRegex.test(value)) {
        return { 'invalidUrl': true };
      }
      return null;
    };
  }

  hasError(controlName: string, errorName: string): boolean {
    const control = this.formInstitution.get(controlName);
    if (!control) return false;
    return control.touched && control.hasError(errorName);
  }
}
