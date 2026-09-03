import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentsComponent } from './components/comments/comments.component';
import { CommentListComponent } from './components/comment-list/comment-list.component';
import { ReplyListComponent } from './components/reply-list/reply-list.component'; 
import { CommentInputComponent } from './components/comment-input/comment-input.component';
import { ModalListReactionsRepliesComponent } from './components/modal-list-reactions-replies/modal-list-reactions-replies.component';
import { SharedModule } from '../shared/shared.module';
import { CarouselModule } from 'primeng/carousel';
import { PdfViewerModule } from 'ng2-pdf-viewer';

// Modulo de:
// Comentarios (Comments)
// Respuestas (Replies)
// Reacciones (Reactions)
@NgModule({
  declarations: [
    CommentsComponent,
    CommentListComponent,
    ReplyListComponent,
    CommentInputComponent,
    ModalListReactionsRepliesComponent,
  ],
  imports: [
    CommonModule,
    SharedModule,
    CarouselModule,
    PdfViewerModule,
  ],
  exports: [
    CommentsComponent
  ]
})
export class InteractionsModule {}
