import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InformationService } from '../services/information.service';
import { Section } from '../models/section';
import { AuthService } from '../../authentication/services/auth.service';
import { PostService } from '../../posts/services/post.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Article } from '../models/article';
import { UserDetail } from '../../posts/models/user-detail';

@Component({
  selector: 'app-section-container',
  templateUrl: './section-container.component.html',
  styleUrl: './section-container.component.scss'
})
export class SectionContainerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly sanitizer = inject(DomSanitizer);
  
  currentSection!: Section;
  articles: Article[] = [];
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public idArticleToEdit: string = '';
  public isEditReady = false;
  public showButtonNewArticle = true;

  ngOnInit() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }

    this.route.paramMap.subscribe(params => {
      const sectionId = params.get('uuid');
      if (sectionId) {
        this.loadSection(sectionId);
      }
    });
  }

  private loadSection(uuid: string) {
    this.informationService.getSectionById(uuid).subscribe(section => {
      this.currentSection = section;
      this.getArticles();
    });
  }

  closeEdit(){
    this.idArticleToEdit = '';
    this.isEditReady = false;
  }

  getArticles(){
    if(!this.currentSection) return;

    this.informationService.getArticlesBySectionUuid(this.currentSection.uuid).subscribe({
      next: (resArticles) => {
        this.articles = resArticles;
      }
    });
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

}
