import { Component ,ElementRef,inject, OnInit, ViewChild } from '@angular/core';
import { PostService } from '../../../posts/services/post.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { TenantService } from '../../../services/tenant.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { switchMap } from 'rxjs';
import { UploadedMedia } from '../../../posts/models/uploaded-media';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
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

  imageFileProfileToCreate!: File;
  imageProfile = '';
  @ViewChild('fileInputProfile') fileInputProfile!: ElementRef;

  ngOnInit(): void {
    this.initForm();

    this.authenticated = this.authService.isAuthenticated();
    if(this.authenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
        this.formUser.patchValue({
          name: this.currentUser.name,
          lastName: this.currentUser.lastName,
          phone: this.currentUser.phone,
        });
      });
    }

    this.tenantService.getInstitution().subscribe(institutionData =>{
      this.institution = institutionData;
    });
  }

  onSubmit(): void {
    if (!this.currentUser || this.formUser.invalid) return;

    this.isLoading = true;
    const updatedUser: UserDetail = {
      ...this.currentUser,
      name: this.formUser.value.name,
      lastName: this.formUser.value.lastName,
      phone: this.formUser.value.phone,
    }

    this.userService.updateUserDate(updatedUser).subscribe({
      next: (userData: UserDetail) => {
        this.isLoading = false;
        this.currentUser = userData;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al editar usuario', error);
      }
    });
  }

  changeInputMediaProfile(event: Event): void {
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFileProfileToCreate = event.target.files[0];
      // Validaciones
      if(!this.isValidFileType(this.imageFileProfileToCreate)){
        alert('Por favor, seleccione una imagen');
        this.resetFileInput(this.fileInputProfile);
        return;
      }

      const formData = new FormData();
      formData.append('image', this.imageFileProfileToCreate);
      // Ensure we have user loaded before updating
      if (!this.currentUser) {
        console.error('No user data available to update.');
        return;
      }
      // Upload image and then update the user photo_profile_path
      this.userService.postUserPhotoProfile(formData).pipe(
        switchMap((uploadedMedia: UploadedMedia[]) => {
          const photoProfileUrl = uploadedMedia[0].urlResource;
          const updatedUser: UserDetail = { ...this.currentUser, photo_profile_path: photoProfileUrl } as UserDetail;
          return this.userService.updateUserDate(updatedUser);
        })
      ).subscribe({
        next: (updatedUser: UserDetail) => {
          this.currentUser = updatedUser;
          this.imageProfile = updatedUser.photo_profile_path || '';
        },
        error: (error) => {
          console.error('Error al subir la imagen de perfil del usuario:', error);
        }
      });
    }
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
