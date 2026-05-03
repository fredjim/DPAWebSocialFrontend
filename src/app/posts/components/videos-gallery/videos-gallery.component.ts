import { Component, OnDestroy, OnInit, Input, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { PostService } from '../../services/post.service';
import { Institution } from '../../models/institution';
import { Post } from '../../models/post';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from './../comments/comments.component';
import { TenantService } from '../../../services/tenant.service';

@Component({
  selector: 'app-videos-gallery',
  templateUrl: './videos-gallery.component.html',
  styleUrls: ['./videos-gallery.component.scss']
})
export class VideosGalleryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly modalService = inject(NgbModal);
  @Input() post: any;
  @Input() institution!: Institution;
  videos: any[] = [];
  isLoading: boolean = true;
    currentPost !: Post;

  constructor(
    private readonly postService: PostService,
    private readonly tenantService: TenantService
  ) {}

  ngOnInit() {
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataInstitution: Institution) => {
          this.institution = dataInstitution;
          this.loadVideos();
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        }
      });
  }

  loadVideos() {
    if (this.institution) {
      this.postService.getInstitutionVideos(this.institution.uuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (videos) => {
            this.videos = videos.map(video => ({
              ...video,
              url: `${video.path}`,
              postUuid: `${video.uuid_post}`
            }));
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading videos', error);
            this.isLoading = false;
          }
        });
    }
  }

  openViewPost(postUuid: string) {
    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataPost: Post) => {
          this.currentPost = dataPost;
          console.log("Post Gallery: "  + JSON.stringify(this.currentPost));
          this.openModal();
        },
        error: (error) => {
          console.log(error);
          this.isLoading = false;
        }
      });
  }

  openModal() {
    const modalRef = this.modalService.open(CommentsComponent, { size: 'xl' });

    modalRef.componentInstance.institution = this.institution;
    modalRef.componentInstance.post = this.currentPost;
    modalRef.componentInstance.postUuid = this.currentPost.uuid;
    modalRef.componentInstance.postImages = this.currentPost.content.media;
    modalRef.componentInstance.postAuthor = this.institution.name;
    modalRef.componentInstance.postDate = this.calculateTimePost;
    modalRef.componentInstance.postDescription = this.currentPost.content.text;
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
      const postDate = new Date(this.currentPost.date)
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