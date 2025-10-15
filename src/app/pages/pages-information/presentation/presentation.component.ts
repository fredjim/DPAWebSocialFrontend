import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../../services/information.service';
import { Article } from '../../models/article';
import { UserDetail } from '../../../posts/models/user-detail';
import { AuthService } from '../../../authentication/services/auth.service';
import { PostService } from '../../../posts/services/post.service';
import { MessageService } from 'primeng/api';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss',
  providers: [MessageService]
})
export class PresentationComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly authService = inject(AuthService);
  private readonly postService = inject(PostService);
  private readonly messageService = inject(MessageService)
  private readonly sanitizer = inject(DomSanitizer)

  articles: Article[] = [];
  public isAuthenticated: boolean = false; 
  public currentUser!: UserDetail;
  public contentEdited: string = ''
  public edit: string = '';

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();
    if(this.isAuthenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
      });
    }

    this.getArticles();
  }

  cancelEdit(){
    this.edit = '';
  }

  getArticles(){
    this.informationService.getAllArticles().subscribe({
      next: (resArticles) => {
        this.articles = resArticles;
        console.log(this.articles);
      }
    });
  }

  saveEdit(isUpdatedArticle: boolean){
    if(isUpdatedArticle){
      this.edit = ''
      this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo editado exitosamente' });
    }else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al editar artículo' });
    }
  }

  public safeText(textToSanitizer: string): SafeHtml {
    const normalizedHtml = this.normalizeLineBreaks(textToSanitizer);
    return this.sanitizer.bypassSecurityTrustHtml(normalizedHtml);
  }

  private normalizeLineBreaks(html: string): string {
    return html.replace(/\n/g, '<br>').replace(/&nbsp;/g, ' ');
  }

  public editInfo(contentToEdit: string, idEdit: string): void{
    this.contentEdited = contentToEdit;
    this.edit = idEdit;
  }
}
