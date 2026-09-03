import { Component, OnDestroy, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { InstitutionService } from '../../../institution/services/institution.service';
import { Institution } from '../../../shared/models/institution';
import { Post } from '../../models/post';
import { TenantInstitutionStateService } from '../../../core/services/tenant-institution-state.service';

@Component({
  selector: 'app-media-gallery',
  templateUrl: './media-gallery.component.html',
  styleUrls: ['./media-gallery.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaGalleryComponent implements OnInit, OnDestroy {
  @Output() openModalPostFromModalGallery = new EventEmitter<{postUuid: string, mediaUrl: string}>();
  private readonly destroy$ = new Subject<void>();
  institution!: Institution;

  photos: {url: string, postUuid: string}[] = [];
  videos: {url: string, postUuid: string}[] = [];
  documents: {url: string, postUuid: string}[] = [];

  photosPage = { page: 0, size: 12, totalElements: 0 };
  videosPage = { page: 0, size: 9, totalElements: 0 };
  documentosPage = { page: 0, size: 20, totalElements: 0 };

  photosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  videosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';
  documentosState: 'idle' | 'loading' | 'loaded' | 'error' = 'idle';

  currentPost !: Post;
  activeTabIndex: number = 0;


  constructor(
    private readonly tenantInstitutionStateService: TenantInstitutionStateService,
    private readonly institutionService: InstitutionService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.tenantInstitutionStateService.currentTenantInstitution$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dataInstitution) => {
          if(!dataInstitution) return;
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

  loadPhotos(page: number = 0) {
    if (!this.institution || this.photosState === 'loading') return;

    this.photosState = 'loading';
    this.cdr.detectChanges();

    this.institutionService.getInstitutionPhotos(this.institution.uuid, page, this.photosPage.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.photos = res.content.map(photo => ({
            url: `${photo.path}`,
            postUuid: `${photo.uuid_post}`
          }));
          this.photosPage.page = res.number;
          this.photosPage.totalElements = res.totalElements;
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

  loadVideos(page: number = 0) {
    if (!this.institution || this.videosState === 'loading') return;

    this.videosState = 'loading';
    this.cdr.detectChanges();

    this.institutionService.getInstitutionVideos(this.institution.uuid, page, this.videosPage.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.videos = res.content.map(video => ({
            url: `${video.path}`,
            postUuid: `${video.uuid_post}`
          }));
          this.videosPage.page = res.number;
          this.videosPage.totalElements = res.totalElements;
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

  loadDocumentos(page: number = 0) {
    if (!this.institution || this.documentosState === 'loading') return;

    this.documentosState = 'loading';
    this.cdr.detectChanges();

    this.institutionService.getInstitutionDocuments(this.institution.uuid, page, this.documentosPage.size)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.documents = res.content.map(doc => ({
            url: `${doc.path}`,
            postUuid: `${doc.uuid_post}`
          }));
          this.documentosPage.page = res.number;
          this.documentosPage.totalElements = res.totalElements;
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

  onPhotosPageChange(event: { page?: number }) {
    this.loadPhotos(event.page ?? 0);
  }

  onVideosPageChange(event: { page?: number }) {
    this.loadVideos(event.page ?? 0);
  }

  onDocumentosPageChange(event: { page?: number }) {
    this.loadDocumentos(event.page ?? 0);
  }

  openViewPost(postUuid: string, mediaUrl: string) {
    this.openModalPostFromModalGallery.emit({ postUuid, mediaUrl });
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index; 
    this.loadDataForCurrentTab();
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}