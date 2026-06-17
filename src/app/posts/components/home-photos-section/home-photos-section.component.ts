import { Component, OnDestroy, OnInit, Input, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '../../services/post.service';
import { InstitutionService } from '../../../institution/services/institution.service';
import { Institution } from '../../../shared/models/institution';
import { Post } from '../../models/post';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from '../../../interactions/components/comments/comments.component';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'home-photos-section',
  templateUrl: './home-photos-section.component.html',
  styleUrls: ['./home-photos-section.component.scss']
})
export class HomePhotosSectionComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly modalService = inject(NgbModal);
  @Input() post!: Post;
  @Input() institution!: Institution;
  photos: {url: string, postUuid: string}[] = [];
  isLoading: boolean = true;
  currentPost !: Post;
  currentSlug: string = '';
  visibleModalMedia: boolean = false;

  constructor(
    private readonly postService: PostService,
    private readonly tenantService: TenantService,
    private readonly institutionService: InstitutionService
  ) {}

  ngOnInit(){
    this.currentSlug = this.tenantService.getSlug();
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataInstitution: Institution) => {
          this.institution = dataInstitution;
          this.loadPhotos();
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        }
      });
  }

  loadPhotos() {
    if (this.institution) {
      this.institutionService.getInstitutionPhotos(this.institution.uuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (photos) => {
            this.photos = photos.slice(-9).map(photo => ({
              url: `${photo.path}`,
              postUuid: `${photo.uuid_post}`
            }));
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading photos', error);
            this.isLoading = false;
          }
        });
    }
  }

  openViewPost(postUuid: string, photoUrl: string) {
    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataPost: Post) => {
          this.currentPost = dataPost;
          const indexImage = this.currentPost.content.media.findIndex( (media) => media.path === photoUrl)
          this.openModal(indexImage);
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        }
      });
  }

  openModal(initialMediaIndex: number) {
    const modalRef = this.modalService.open(CommentsComponent, { size: 'xl' });

    modalRef.componentInstance.institution = this.institution;
    modalRef.componentInstance.post = this.currentPost;
    modalRef.componentInstance.postUuid = this.currentPost.uuid;
    modalRef.componentInstance.postMedia = this.currentPost.content.media;
    modalRef.componentInstance.postAuthor = this.institution.name;
    modalRef.componentInstance.postDate = this.calculateTimePost;
    modalRef.componentInstance.postDescription = this.currentPost.content.text;
    modalRef.componentInstance.initialMediaIndex = initialMediaIndex;
  }

  getPost(postUuid: string) {
    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataPost: Post) => {
          this.currentPost = dataPost;
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
    calculateTimePost() {
      const postDate = new Date(this.post.date)
      const currentDate = new Date(Date.now());
      const diferenciaMs: number = currentDate.getTime() - postDate.getTime(); // Diferencia en milisegundos
      const unMinuto = 60 * 1000;
      const unaHora = 60 * unMinuto;
      const unDia = 24 * unaHora;
      const sieteDias = 7 * unDia;
  
      if (diferenciaMs < unMinuto) {
        return 'Hace un momento';
      } else if (diferenciaMs < unaHora) {
        const minutos = Math.floor(diferenciaMs / unMinuto);
        return `Hace ${minutos} min`;
      } else if (diferenciaMs < unDia) {
        const horas = Math.floor(diferenciaMs / unaHora);
        return `Hace ${horas} h`;
      } else if (diferenciaMs < sieteDias) {
        const dias = Math.floor(diferenciaMs / unDia);
        return `Hace ${dias} d`;
  
      } else {
        const opciones: Intl.DateTimeFormatOptions = {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        return postDate.toLocaleDateString('es-ES', opciones);
      }
    }
}