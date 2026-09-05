import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavItemService } from '../../../layout/services/nav-item.service';
import { SectionService } from '../../../layout/services/section.service';
import { ArticleService } from '../../services/article.service';
import { Section } from '../../../shared/models/section';
import { UserStateService } from '../../../core/services/user-state.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Article } from '../../models/article';
import { UserDetail } from '../../../shared/models/user-detail';
import { SectionStateService } from '../../../layout/services/sections-state.service';
import { Subscription, switchMap } from 'rxjs';
import { Link } from '../../models/link';
import { MediaArticle } from '../../models/media-article';
import { NavItem } from '../../../shared/models/nav-item';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { Media } from '../../../shared/models/media';

@Component({
  selector: 'app-article-container',
  templateUrl: './article-container.component.html',
  styleUrl: './article-container.component.scss'
})
export class ArticleContainerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navItemService = inject(NavItemService);
  private readonly sectionService = inject(SectionService);
  private readonly articleService = inject(ArticleService);
  private readonly userStateService = inject(UserStateService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly sectionStateService = inject(SectionStateService);
  private sectionUpdateSubscription?: Subscription;
  private readonly subscriptions = new Subscription();
  
  currentSection!: Section;
  articles: Article[] = []; 
  public currentUser!: UserDetail;
  public currentNavItem!: NavItem;
  public idArticleToEdit: string = '';
  public isEditReady = false;
  public showButtonNewArticle = true;
  public visibleModalNewButton = false;
  public buttonsOfArticle: Link[] | Omit<Link, 'uuid'>[] = [];
  public visibleModalImagesArticle = false;
  public mediasToModal: MediaArticle[] = [];
  public initialImageModal: number = 0;
  public typeImages = ['image', 'image/webp', 'image/jpg', 'image/jpeg', 'image/png'];
  public typeDocs = ['document', 'application/pdf'];
  public currentNavItemPath!: string | null;

  @ViewChild('sectionToastRef') private readonly sectionToastRef!: CustomToastComponent;

  // Variable para el zoom
  zoomLevel = 1;
  minZoom = 1;
  maxZoom = 3;
  zoomStep = 0.5;

  panX = 0;
  panY = 0;
  private isPanning = false;
  private lastX = 0;
  private lastY = 0;
  private pointerId: number | null = null;
  private maxPanX = 0;
  private maxPanY = 0;

  ngOnInit() {
    this.subscriptions.add(
      this.userStateService.currentUser$.subscribe(user => {
        if (!user) return;
        this.currentUser = user;
      })
    )

    this.subscriptions.add(
      this.route.parent?.paramMap.pipe(
        switchMap(params => {
          this.currentNavItemPath = params.get('pathNavItem');

          if(this.currentNavItemPath)
            return this.navItemService.getAllNavItems();
          return [];
        })
      ).subscribe(navItems => {
        const navItemFinded = navItems.find(
          navItem => navItem.path === this.currentNavItemPath
        );
        
        if (navItemFinded) {
          this.currentNavItem = navItemFinded;
        } else {
          this.router.navigate(['/posts']);
        }
      })
    );

    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const sectionPath = params.get('pathSection');
        if (sectionPath) {
          this.loadSection(sectionPath);
          this.setupSectionUpdates();
        }
      })
    );
  }

  ngOnDestroy() {
    this.sectionUpdateSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  private loadSection(path: string) {
    this.sectionService.getSectionByPath(path).pipe(
      switchMap(section => {
        this.currentSection = section;
        this.checkForSectionUpdates(); // Verificación inicial
        return this.articleService.getArticlesBySectionUuid(section.uuid);
      })
    ).subscribe(articles => {
      this.articles = articles;
    });
  }

  private setupSectionUpdates() {
    this.sectionUpdateSubscription = this.sectionStateService.currentSection$.subscribe(updated => {
      if (updated && this.currentSection?.uuid === updated?.uuid) {
        this.currentSection.name = updated.name;
        this.sectionStateService.clearSection();
      }
    });
  }

  // Verificación inicial por si ya hay una sección en el estado
  private checkForSectionUpdates() {
    const currentState = this.sectionStateService.getCurrentSectionValue();
    if (currentState && this.currentSection?.uuid === currentState?.uuid) {
      this.currentSection.name = currentState.name;
    }
  }

  closeEdit(){
    this.idArticleToEdit = '';
    this.isEditReady = false;
  }

  public safeText(textToSanitizer: string): SafeHtml {
    const normalizedHtml = this.normalizeLineBreaks(textToSanitizer);
    return this.sanitizer.bypassSecurityTrustHtml(normalizedHtml);
  }

  private normalizeLineBreaks(html: string): string {
    return html.replaceAll('\n', '<br>').replaceAll('&nbsp;', ' ');
  }

  public editInfo(idEdit: string): void{
    this.idArticleToEdit = idEdit;
    this.isEditReady = false;
  }

  public onUpdateArticle(updatedArticle: Article): void {
    this.articles = this.articles.map(art => art.uuid === updatedArticle.uuid ? updatedArticle : art);
    this.sectionToastRef.showSuccess('Artículo editado exitosamente', 'Exitoso');
  }

  public onDeleteArticle(deletedArticle: Article): void {
    this.articles = this.articles.filter(art => art.uuid !== deletedArticle.uuid);
    this.sectionToastRef.showSuccess('Artículo eliminado exitosamente', 'Exitoso');
  }

  public onCreateArticle(createdArticle: Article): void {
    this.articles.push(createdArticle);
    this.sectionToastRef.showSuccess('Artículo creado exitosamente', 'Exitoso');
  }

  onEditComponentReady() {
    this.isEditReady = true;
  }

  hideButtonNewArticle(): void {
    this.showButtonNewArticle = false
  }

  showModalArticleMedias(mediasArticle: MediaArticle[], imgUuid: string): void {
    this.mediasToModal = mediasArticle.filter(media => media.type.includes('image'));
    this.initialImageModal = this.mediasToModal.findIndex((media) => media.uuid === imgUuid)
    this.visibleModalImagesArticle = true;
  }
  
  closeModalArticleMedias(): void {
    this.mediasToModal = [];
    this.initialImageModal = 0;
    this.resetZoom();
  }

  existTypeMedia(article: Article, typesExist: string[]): boolean {
    return article.medias.some(media => typesExist.includes(media.type));
  }

  // Metodos para el zoom en carousel
  async downloadMedia(media: Media, event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation(); // evita que el click llegue al <video> o <img> de atrás

    if(!media.path) return;
    try {
      const response = await fetch(media.path);
      const originalBlob = await response.blob();

      // Forzamos el tipo genérico para que el navegador no intente "previsualizar"
      // el archivo y en su lugar dispare la descarga directa.
      const forcedBlob = new Blob([originalBlob], { type: 'application/octet-stream' });

      const blobUrl = window.URL.createObjectURL(forcedBlob);
      const filename = media.name || media.path.split('/').pop() || `media-${Date.now()}`;

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error al descargar el archivo', error);
      this.sectionToastRef.showError('Error al descargar el archivo', 'Error');
    }
  }

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + this.zoomStep, this.maxZoom);
    this.panX = 0;
    this.panY = 0;
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - this.zoomStep, this.minZoom);
    this.panX = 0;
    this.panY = 0;
  }

  resetZoom(): void {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;
  }

  onCarouselPageChange(): void {
    this.resetZoom();
  }

  startPan(event: PointerEvent): void {
    if (this.zoomLevel === 1) return;
    this.isPanning = true;
    this.pointerId = event.pointerId;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
    this.lastX = event.clientX;
    this.lastY = event.clientY;

    this.calculatePanBounds(event.target as HTMLImageElement);
  }


  onPan(event: PointerEvent): void {
    if (!this.isPanning || event.pointerId !== this.pointerId) return;

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;

    const newPanX = this.panX + deltaX / this.zoomLevel;
    const newPanY = this.panY + deltaY / this.zoomLevel;

    // clamp: no dejamos que el pan supere los límites calculados
    this.panX = Math.max(-this.maxPanX, Math.min(this.maxPanX, newPanX));
    this.panY = Math.max(-this.maxPanY, Math.min(this.maxPanY, newPanY));

    this.lastX = event.clientX;
    this.lastY = event.clientY;
  }

  endPan(event: PointerEvent): void {
    this.isPanning = false;

    if (this.pointerId !== null) {
      const target = event.target as HTMLElement;
      if (target.hasPointerCapture(this.pointerId)) {
        target.releasePointerCapture(this.pointerId);
      }
    }

    this.pointerId = null;
  }

  startPanTouch(event: TouchEvent): void {
    if (this.zoomLevel === 1) return;
    const touch = event.touches[0];
    this.isPanning = true;
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
  }

  onPanTouch(event: TouchEvent): void {
    if (!this.isPanning) return;
    event.preventDefault(); // evita que el navegador haga scroll de la página mientras arrastrás
    event.stopPropagation();
    const touch = event.touches[0];
    const deltaX = touch.clientX - this.lastX;
    const deltaY = touch.clientY - this.lastY;
    this.panX += deltaX / this.zoomLevel;
    this.panY += deltaY / this.zoomLevel;
    this.lastX = touch.clientX;
    this.lastY = touch.clientY;
  }

  private calculatePanBounds(imgEl: HTMLImageElement): void {
    const container = imgEl.closest('.zoom-container') as HTMLElement;
    if (!container) return;

    // offsetWidth/offsetHeight dan el tamaño "de layout" sin el transform aplicado,
    // que es lo que necesitamos como base antes de escalar
    const scaledWidth = imgEl.offsetWidth * this.zoomLevel;
    const scaledHeight = imgEl.offsetHeight * this.zoomLevel;

    const overflowX = Math.max(0, scaledWidth - container.offsetWidth);
    const overflowY = Math.max(0, scaledHeight - container.offsetHeight);

    // dividimos por zoomLevel porque panX/panY se acumulan en unidades
    // "pre-escala" (ver por qué en onPan: deltaX / zoomLevel)
    this.maxPanX = overflowX / 2 / this.zoomLevel;
    this.maxPanY = overflowY / 2 / this.zoomLevel;
  }
}
