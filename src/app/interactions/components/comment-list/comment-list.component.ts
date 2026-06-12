import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, OnInit, ViewChild } from '@angular/core';
import { Comment } from '../../models/comment';
import { Reply } from '../../models/reply';
import { UserDetail } from '../../../shared/models/user-detail';
import moment from 'moment-timezone';
import { ReactionService } from '../../services/reaction.service'; 
import { CommentService } from '../../services/comment.service'; 
import { EmojiType } from '../../../shared/models/emoji-type';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../authentication/services/auth.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalListReactionsRepliesComponent } from '../modal-list-reactions-replies/modal-list-reactions-replies.component'; // Ajusta la ruta si es necesario
import { HttpErrorResponse } from '@angular/common/http';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.scss']
})
export class CommentListComponent implements OnInit, OnChanges, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() comments: Comment[] = [];
  @Input() currentUser: UserDetail | null = null;
  @Input() authenticated: boolean = false;
  @Input() commentsEnabled: boolean = true;
  @Input() postUuid: string = '';
  @Output() onAddReply = new EventEmitter<{ parentUuid: string, replyText: string, isTopLevel: boolean }>();
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;
  commentReactionsCount: { [commentUuid: string]: number } = {};
  replyInputVisible: { [key: string]: boolean } = {};
  replyText: { [key: string]: string } = {};
  replyLimit: { [key: string]: number } = {};
  replyVisibility: { [key: string]: boolean } = {};
  emojis: EmojiType[] = [];
  selectedReactions: { [key: string]: string } = {}; // Guarda el emoji seleccionado por comentario
  visibleModalDeleteComment = false;
  isLoadingDeleteComment = false;
  commentToDelete: Comment | null = null; 
  indexCommentDelete: number = -1;
  showEmojiOptions: { [uuid: string]: boolean } = {};
  defaultEmoji: any = {
    uuid: '',
    emoji_code: '👍',
    emoji_name: 'thumbs-up',
    class: 'thumbs-up'
  };

  // Mapea emoji_name a una clase CSS para estilos tipo Facebook
  emojiClassMap: { [key: string]: string } = {
    'thumbs-up': 'thumbs-up',
    'red-heart': 'red-heart',
    'crying-face': 'crying-face',
    'angry-face': 'angry-face',
    'grinning-squinting-face': 'grinning-squinting-face',
    'astonished-face': 'astonished-face'
  };

  constructor(
    private readonly commentService: CommentService,
    private readonly reactionService: ReactionService,
    private readonly authService: AuthService,
    private readonly modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadEmojis();
    this.loadUserReactionsForComments();
    this.loadCommentsReactionsCount();
  }
  getEmojiLabel(emojiName?: string): string {
    switch (emojiName) {
      case 'thumbs-up': return 'Me gusta';
      case 'red-heart': return 'Me encanta';
      case 'crying-face': return 'Me entristece';
      case 'angry-face': return 'Me enoja';
      case 'grinning-squinting-face': return 'Me divierte';
      case 'astonished-face': return 'Me asombra';
      default: return 'Me gusta';
    }
  }
  loadEmojis() {
    this.reactionService.getEmojisType()
      .pipe(takeUntil(this.destroy$))
      .subscribe(emojis => {
      // Agrega la clase a cada emoji para usar en el botón
      this.emojis = emojis.map(e => ({
        ...e,
        class: this.emojiClassMap[e.emoji_name] || 'default'
      }));
      // El primer emoji será el default (👍)
      if (this.emojis.length) {
        this.defaultEmoji = { ...this.emojis[0], class: this.emojiClassMap[this.emojis[0].emoji_name] };
      }
    });
  }

  getEmojiClass(commentUuid: string): string {
    const emoji = this.getSelectedEmoji(commentUuid);
    if (!emoji) return 'default';
    switch (emoji.emoji_name) {
      case 'thumbs-up': return 'thumbs-up';
      case 'red-heart': return 'red-heart';
      case 'crying-face': return 'crying-face';
      case 'angry-face': return 'angry-face';
      case 'grinning-squinting-face': return 'grinning-squinting-face';
      case 'astonished-face': return 'astonished-face';
      default: return 'default';
    }
  }
  // Devuelve el objeto emoji seleccionado para el comentario
  getSelectedEmoji(commentUuid: string) {
    const emojiUuid = this.selectedReactions[commentUuid];
    return this.emojis.find(e => e.uuid === emojiUuid);
  }

  reactToComment(commentUuid: string, emojiTypeUuid: string, forceChange: boolean = false) {
    // Si ya hay reacción y NO es un cambio forzado (click en botón principal), elimina la reacción
    if (this.selectedReactions[commentUuid] && !forceChange) {
      this.removeReaction(commentUuid);
      return;
    }
    // Si ya hay reacción y es un cambio forzado (click en emoji diferente), actualiza la reacción
    const body = {
      emojiTypeId: emojiTypeUuid,
      reactionDate: new Date().toISOString()
    };
    this.reactionService.reactToComment(commentUuid, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      this.selectedReactions[commentUuid] = emojiTypeUuid;
      this.loadCommentsReactionsCount();
    });
  }

  removeReaction(commentUuid: string) {
    this.reactionService.deleteCommentReaction(commentUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      this.selectedReactions[commentUuid] = '';
      this.loadCommentsReactionsCount();
    });
  }
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comments']) {
      this.initializeReplyLimits();
      this.loadUserReactionsForComments();
      this.loadCommentsReactionsCount();
    }
  }

  private initializeReplyLimits(): void {
    this.comments.forEach(comment => {
      this.replyLimit[comment.uuid] = 0;
      this.replyVisibility[comment.uuid] = false;

      if (comment.replies) {
        comment.replies.forEach(reply => {
          this.initializeReply(reply);
        });
      }
    });
  }

  private initializeReply(reply: Reply): void {
    this.replyLimit[reply.uuid] = 1;
    this.replyVisibility[reply.uuid] = false;

    if (reply.replies) {
      reply.replies.forEach(nestedReply => {
        this.initializeReply(nestedReply);
      });
    }
  }

  toggleReplyInput(uuid: string): void {
    this.replyInputVisible[uuid] = !this.replyInputVisible[uuid];
    if (this.replyInputVisible[uuid]) {
      this.replyText[uuid] = '';
    }
  }

  addReply(parentUuid: string, replyUuid: string, isTopLevel: boolean): void {
    if (this.replyText[replyUuid]?.trim()) {
      this.onAddReply.emit({
        parentUuid,
        replyText: this.replyText[replyUuid],
        isTopLevel
      });
      this.replyText[replyUuid] = '';
      this.replyInputVisible[replyUuid] = false;
    }
  }

  showLessReplies(uuid: string): void {
    this.replyLimit[uuid] = 0;
    this.replyVisibility[uuid] = false;
  }

  showAllReplies(uuid: string): void {
    const item = this.findItemByUuid(uuid, this.comments);
    if (item) {
      this.replyLimit[uuid] = item.replies?.length || 0;
      this.replyVisibility[uuid] = true;
    }
  }

  private findItemByUuid(uuid: string, items: any[]): any {
    for (let item of items) {
      if (item.uuid === uuid) return item;
      if (item?.replies.length) {
        let found = this.findItemByUuid(uuid, item.replies);
        if (found) return found;
      }
    }
    return null;
  }

  calculateTimeFromNow(date: string): string {
    return moment.utc(date).local().fromNow();
  }

  loadUserReactionsForComments() {
    const userId = this.authService.getUserId();
    if (!userId || !this.comments) return;

    // Llama a getCommentsReactions para cada comentario
    const reactionsObservables = this.comments.map(comment =>
      this.reactionService.getCommentReactions(comment.uuid)
    );

    forkJoin(reactionsObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe(allReactions => {
      allReactions.forEach((reactions, idx) => {
        const comment = this.comments[idx];
        const myReaction = reactions.find((r: any) => r.userId === userId);
        if (myReaction) {
          this.selectedReactions[comment.uuid] = myReaction.emojiTypeId;
        }
      });
    });
  }

  loadCommentsReactionsCount() {
    if (!this.comments) return;
    this.comments.forEach(comment => {
      this.reactionService.getCommentReactions(comment.uuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe(reactions => {
          this.commentReactionsCount[comment.uuid] = reactions.length;
        });
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getCommentReactionsCount(comment: Comment): number {
    return this.commentReactionsCount[comment.uuid] || 0;
  }
  openCommentReactionsModal(comment: Comment) {
    this.reactionService.getCommentReactions(comment.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reactions => {
      // Mapea los datos para el modal
      const detailReactions = reactions.map((r: any) => ({
        userName: r.userName || r.user_name, // Ajusta según tu backend
        userPhoto: r.userPhoto || r.user_photo,
        emoji: this.emojis.find(e => e.uuid === (r.emojiTypeId || r.emoji_type_id))?.emoji_code || ''
      }));

      // Calcula el conteo de reacciones por tipo de emoji
      const reactionsCount = this.emojis
        .map(e => ({
          emojiTypeId: e.uuid,
          emoji: e.emoji_code,
          count: reactions.filter((r: any) => (r.emojiTypeId || r.emoji_type_id) === e.uuid).length
        }))
        .filter(rc => rc.count > 0);

      const modalRef = this.modalService.open(ModalListReactionsRepliesComponent, { size: 'md' });
      modalRef.componentInstance.detailReactions = detailReactions;
      modalRef.componentInstance.listEmojiType = this.emojis;
      modalRef.componentInstance.commentOrReplyUuid = comment.uuid;
      modalRef.componentInstance.reactionsCount = reactionsCount;
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }

  showModalDeleteComment(comment: Comment, indexComment: number): void {
    this.commentToDelete = comment;
    this.indexCommentDelete = indexComment;
    this.visibleModalDeleteComment = true;
  }

  deleteComment(): void {
    if(!this.postUuid || !this.commentToDelete) return;

    this.isLoadingDeleteComment = true;
    this.commentService.deleteComment(this.postUuid, this.commentToDelete.uuid).subscribe({
      next: () => {
        this.isLoadingDeleteComment = false;
        this.visibleModalDeleteComment = false;
        this.comments.splice(this.indexCommentDelete, 1);
        this.commentToDelete = null;
        this.indexCommentDelete = -1
        this.toastRef.showSuccess('Comentario eliminado exitosamente', 'Éxito');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDeleteComment = false;
        this.toastRef.showError('Error al eliminar comentario', 'Error');
        console.log('Error al eliminar comentario', error);
      }
    })

  }
}