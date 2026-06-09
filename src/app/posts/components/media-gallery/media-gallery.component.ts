import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { filter, Subject, takeUntil } from 'rxjs';
import { PostService } from '../../services/post.service';
import { Institution } from '../../models/institution';
import { Post } from '../../models/post';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from '../comments/comments.component';
import { TenantService } from '../../../core/services/tenant.service';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { MediaInstitution } from '../../models/media-institution';

@Component({
  selector: 'app-media-gallery',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGalleryComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private readonly modalService = inject(NgbModal);
  institution!: Institution;

  photos: {url: string, postUuid: string}[] = [];
  videos: {url: string, postUuid: string}[] = [];
  documents: {url: string, postUuid: string}[] = [];

  photosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  videosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  documentosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';

  currentPost !: Post;
  currentSlug: string = '';
  activeTabIndex: number = 0;


  constructor(
    private readonly postService: PostService,
    private readonly tenantService: TenantService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.currentSlug = this.tenantService.getSlug();

    // Sincronizar al iniciar
    this.syncTabFromRoute();

    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataInstitution: Institution) => {
          this.institution = dataInstitution;
          this.loadDataForCurrentTab();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.log(error);
          this.photosState = 'error';
          this.videosState = 'error';
          this.documentosState = 'error';
          this.cdr.detectChanges();
        }
      });

    // Sincronizar cuando cambia la ruta desde fuera (URL, back/forward)
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.syncTabFromRoute();
        this.loadDataForCurrentTab();
        this.cdr.detectChanges();
      });
  }

  private loadDataForCurrentTab() {
    switch(this.activeTabIndex) {
      case 0: // Fotos
        if (this.photosState === 'idle') {
          this.loadPhotos();
        }
        break;
      case 1: // Videos
        if (this.videosState === 'idle') {
          this.loadVideos();
        }
        break;
      case 2: // Documentos
        if (this.documentosState === 'idle') {
          this.loadDocumentos();
        }
        break;
    }
  }

  loadPhotos() {
    if (!this.institution || this.photosState !== 'idle') return;
    
    this.photosState = 'loading';
    this.cdr.detectChanges();

    this.postService.getInstitutionPhotos(this.institution.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (photos: MediaInstitution[]) => {
          this.photos = photos.map(photo => ({
            url: `${photo.path}`,
            postUuid: `${photo.uuid_post}`
          }));
          this.photosState = 'loaded';
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading photos', error);
          this.photosState = 'error';
          this.cdr.detectChanges();
        }
      });
  }

  loadVideos() {
    if (!this.institution || this.videosState !== 'idle') return;
    
    this.videosState = 'loading';
    this.cdr.detectChanges();

    this.postService.getInstitutionVideos(this.institution.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (videos: MediaInstitution[]) => {
          this.videos = videos.map(video => ({
            url: `${video.path}`,
            postUuid: `${video.uuid_post}`
          }));
          this.videosState = 'loaded';
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading videos', error);
          this.videosState = 'error';
          this.cdr.detectChanges();
        }
      });
  }

  loadDocumentos() {
    if (!this.institution || this.documentosState !== 'idle') return;
    
    this.documentosState = 'loading';
    this.cdr.detectChanges();

    this.postService.getInstitutionDocuments(this.institution.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents: MediaInstitution[]) => {
          this.documents = documents.map(doc => ({
            url: `${doc.path}`,
            postUuid: `${doc.uuid_post}`
          }));
          this.documentosState = 'loaded';
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading documents', error);
          this.documentosState = 'error';
          this.cdr.detectChanges();
        }
      });
  }

  openViewPost(postUuid: string, mediaUrl: string) {
    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataPost: Post) => {
          this.currentPost = dataPost;
          const indexMedia = this.currentPost.content.media.findIndex( (media) => media.path === mediaUrl)
          this.openModal(indexMedia);
        },
        error: (error) => {
          console.log(error);
          this.photosState = 'error';
          this.videosState = 'error';
          this.documentosState = 'error';
        }
      });
  }

  private syncTabFromRoute() {
    const currentPath = this.router.url.split('/').pop();
    switch(currentPath) {
      case 'videos':
        this.activeTabIndex = 1;
        break;
      case 'documentos':
        this.activeTabIndex = 2;
        break;
      default:
        this.activeTabIndex = 0; // fotos por defecto
    }
    this.cdr.detectChanges();
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index; 
    const routes = ['fotos', 'videos', 'documentos'];
    const selectedRoute = routes[event.index];
    
    this.router.navigate([selectedRoute], { 
      relativeTo: this.route.parent,
      replaceUrl: true
    });
  }

  retryPhotos() {
    this.photosState = 'idle';
    this.loadPhotos();
  }

  retryVideos() {
    this.videosState = 'idle';
    this.loadVideos();
  }

  retryDocuments() {
    this.documentosState = 'idle';
    this.loadDocumentos();
  }

  openModal(initialMediaIndex: number = 0) {
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private calculateTimePost() {
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