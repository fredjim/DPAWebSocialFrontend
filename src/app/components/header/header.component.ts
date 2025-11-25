import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Institution } from '../../posts/models/institution';
import { PostService } from '../../posts/services/post.service';
import { environment } from '../../../environments/environment';
import { Subject, takeUntil } from 'rxjs';
import { Modal } from 'bootstrap';
import { AuthService } from '../../authentication/services/auth.service';
import { CommentService } from '../../comments/services/comment.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit, OnDestroy {

  uuidIntitution = `${environment.INSTITUTION_ID}`;

  institution!: Institution
  totalFollowers!: number;
  isMenuOpen = false;

  authenticated: boolean = false;
  canModerate: boolean = false; // Nueva propiedad
  
  isMobileMenuOpen = false;
  
  user: any
  counterModeratedComments: number = 0;

  private readonly destroy$ = new Subject<void>();
  private modalInstance?: Modal; // Para gestionar el modal

  @ViewChild('moderateCommentModal') modalElement!: ElementRef;

  constructor(private readonly authService: AuthService, 
    private readonly postService: PostService, 
    private readonly commentService: CommentService) {
    this.authenticated = authService.isAuthenticated();
    this.canModerate = authService.canModerate();
  }

  ngOnInit() {
    this.getInstitution();
    this.getUser();
    this.totalModeratedComments();
  }

  ngOnDestroy() {
    // Limpiar modal si existe
    if (this.modalInstance) {
      this.modalInstance.dispose();
      this.modalInstance = undefined;
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  getInstitution() {
    const uuid = this.uuidIntitution;
    this.postService.getInstitution(uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institutionData) => {
          this.institution = institutionData;
        },
        error: (error) => {
          // Error manejado silenciosamente
        }
      });
  }

  getUser() {
    if (this.authenticated) {
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (infoUser) => {
            this.user = infoUser;
          },
          error: (error) => {
            console.log('Error al obtener al user', error);
          }
        })
    }
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

  totalModeratedComments() {
    if (this.authenticated && this.canModerate) {
      this.commentService.countModeratedComments()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (total) => {
            this.counterModeratedComments = total;
          },
          error: (error) => {
            console.error('Error al obtener contador de comentarios:', error);
          }
        });
    }
  }

  showModeratedComments() {
    const modalElement = document.getElementById('moderateCommentModal');
    if (modalElement) {
      // Limpiar modal anterior si existe
      if (this.modalInstance) {
        this.modalInstance.dispose();
      }

      // Crear nueva instancia del modal
      this.modalInstance = new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  onCounterUpdated(newCount: number) {
    this.counterModeratedComments = newCount;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }

}
