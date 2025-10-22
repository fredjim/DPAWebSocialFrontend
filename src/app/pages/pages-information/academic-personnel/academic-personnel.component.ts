import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../../services/information.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { PostService } from '../../../posts/services/post.service';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Article } from '../../models/article';
import { UserDetail } from '../../../posts/models/user-detail';

@Component({
  selector: 'app-academic-personnel',
  templateUrl: './academic-personnel.component.html',
  styleUrl: './academic-personnel.component.scss'
})
export class AcademicPersonnelComponent implements OnInit {
  public readonly UUID_SECTION = '942ib4e8-0856-4aad-b3aa-747e2dba76d9';
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly sanitizer = inject(DomSanitizer);

  articles: Article[] = [];
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public contentEdited: string = ''
  public idArticleToEdit: string = '';
  public isEditReady = false;
  public showButtonNewArticle = true;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }

    this.getArticles();
  }

  closeEdit(){
    this.idArticleToEdit = '';
    this.isEditReady = false;
  }

  getArticles(){
    this.informationService.getArticlesBySectionUuid(this.UUID_SECTION).subscribe({
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

  public editInfo(contentToEdit: string, idEdit: string): void{
    this.contentEdited = contentToEdit;
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
