import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { InformationService } from '../services/information.service';
import { Section } from '../models/section';
import { AuthService } from '../../authentication/services/auth.service';
import { PostService } from '../../posts/services/post.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Article } from '../models/article';
import { UserDetail } from '../../posts/models/user-detail';
import { SectionStateService } from '../services/sections-state.service';
import { Subscription, switchMap } from 'rxjs';
import { TenantService } from '../../services/tenant.service';
import { Institution } from '../../posts/models/institution';
import { Link } from '../models/link';
import { MediaArticle } from '../models/media-article';
import { NavItem } from '../models/nav-item';

@Component({
  selector: 'app-section-container',
  templateUrl: './section-container.component.html',
  styleUrl: './section-container.component.scss'
})
export class SectionContainerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly sectionStateService = inject(SectionStateService);
  private readonly tenantService = inject(TenantService);
  private sectionUpdateSubscription?: Subscription;
  private readonly subscriptions = new Subscription();
  
  currentSection!: Section;
  articles: Article[] = [];
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public currentInstitution!: Institution;
  public currentNavItem!: NavItem;
  public idArticleToEdit: string = '';
  public isEditReady = false;
  public showButtonNewArticle = true;
  public visibleModalNewButton = false;
  public buttonsOfArticle: Link[] | Omit<Link, 'uuid'>[] = [];
  public visibleModalImagesArticle = false;
  public mediasToModal: MediaArticle[] = [];
  public typeImages = ['image', 'image/webp', 'image/jpg', 'image/jpeg', 'image/png'];
  public typeDocs = ['document', 'application/pdf'];
  public currentNavItemPath!: string | null;

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }

    this.subscriptions.add(
      this.route.parent?.paramMap.pipe(
        switchMap(params => {
          this.currentNavItemPath = params.get('pathNavItem');

          if(this.currentNavItemPath)
            return this.informationService.getAllNavItems();
          return [];
        })
      ).subscribe(navItems => {
        const navItemFinded = navItems.find(
          navItem => navItem.path === this.currentNavItemPath
        );
        
        if (navItemFinded) {
          this.currentNavItem = navItemFinded;
        } else {
          this.router.navigate(['/']);
        }
      })
    );

    this.tenantService.getInstitution().subscribe(institution => {
      this.currentInstitution = institution;
    });

    this.subscriptions.add(
      this.route.paramMap.subscribe(params => {
        const sectionId = params.get('uuidSection');
        if (sectionId) {
          this.loadSection(sectionId);
          this.setupSectionUpdates();
        }
      })
    );
  }

  ngOnDestroy() {
    this.sectionUpdateSubscription?.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  private loadSection(uuid: string) {
    this.informationService.getSectionById(uuid).pipe(
      switchMap(section => {
        this.currentSection = section;
        this.checkForSectionUpdates(); // Verificación inicial
        return this.informationService.getArticlesBySectionUuid(section.uuid);
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
  }

  public onDeleteArticle(deletedArticle: Article): void {
    this.articles = this.articles.filter(art => art.uuid !== deletedArticle.uuid);
  }

  public onCreateArticle(createdArticle: Article): void {
    this.articles.push(createdArticle);
  }

  onEditComponentReady() {
    this.isEditReady = true;
  }

  hideButtonNewArticle(): void {
    this.showButtonNewArticle = false
  }

  showModalArticleMedias(mediasArticle: MediaArticle[]): void {
    this.mediasToModal = mediasArticle.filter(media => media.type.includes('image'));
    this.visibleModalImagesArticle = true;
  }
  
  closeModalArticleMedias(): void {
    this.mediasToModal = [];

  }

  existTypeMedia(article: Article, typesExist: string[]): boolean {
    return article.medias.some(media => typesExist.includes(media.type));
  }
}
