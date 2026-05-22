import { Component, Input, OnDestroy, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import moment from 'moment-timezone';
import { PostService } from '../../../services/post.service';
import { EmojiType } from '../../../models/emoji-type';
import { AuthService } from '../../../../authentication/services/auth.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ModalListReactionsRepliesComponent } from '../modal-list-reactions-replies/modal-list-reactions-replies.component'; // Ajusta la ruta si es necesario
import { Reply } from '../../../models/comment';
import { HttpErrorResponse } from '@angular/common/http';
import { CustomToastComponent } from '../../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-reply-list',
  templateUrl: './reply-list.component.html',
  styleUrls: ['./reply-list.component.scss']
})
export class ReplyListComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @Input() parentUuid: string = '';
  @Input() replies: any[] = [];
  @Input() currentUser: any;
  @Input() replyInputVisible: { [key: string]: boolean } = {};
  @Input() replyText: { [key: string]: string } = {};
  @Input() replyLimit: { [key: string]: number } = {};
  @Input() authenticated: boolean = false;

  @Output() toggleReplyInput = new EventEmitter<string>();
  @Output() addReply = new EventEmitter<{ replyUuid: string, isTopLevel: boolean }>();
  @Output() showAllReplies = new EventEmitter<string>();
  @Output() showLessReplies = new EventEmitter<string>();
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;
  visibleModalDeleteReply = false;
  isLoadingDeleteRyply = false;
  replyToDelete: Reply | null = null;
  indexReplyToDelete: number = -1;
  emojis: EmojiType[] = [];
  selectedReactions: { [key: string]: string } = {};
  replyReactionsCount: { [replyUuid: string]: number } = {};
  showEmojiOptions: { [uuid: string]: boolean } = {};
  defaultEmoji: any = {
    uuid: '',
    emoji_code: '👍',
    emoji_name: 'thumbs-up',
    class: 'thumbs-up'
  };
  emojiClassMap: { [key: string]: string } = {
    'thumbs-up': 'thumbs-up',
    'red-heart': 'red-heart',
    'crying-face': 'crying-face',
    'angry-face': 'angry-face',
    'grinning-squinting-face': 'grinning-squinting-face',
    'astonished-face': 'astonished-face'
  };

  constructor(
    private readonly postService: PostService,
    private readonly authService: AuthService,
    private readonly modalService: NgbModal
  ) { }

  ngOnInit() {
    this.loadEmojis();
    this.loadUserReactionsForReplies();
    this.loadRepliesReactionsCount();
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
    this.postService.getEmojisType()
      .pipe(takeUntil(this.destroy$))
      .subscribe(emojis => {
      this.emojis = emojis.map(e => ({
        ...e,
        class: this.emojiClassMap[e.emoji_name] || 'default'
      }));
      if (this.emojis.length) {
        this.defaultEmoji = { ...this.emojis[0], class: this.emojiClassMap[this.emojis[0].emoji_name] };
      }
    });
  }

  getEmojiClass(replyUuid: string): string {
    const emoji = this.getSelectedEmoji(replyUuid);
    if (!emoji) return 'default';
    return this.emojiClassMap[emoji.emoji_name] || 'default';
  }

  getSelectedEmoji(replyUuid: string) {
    const emojiUuid = this.selectedReactions[replyUuid];
    return this.emojis.find(e => e.uuid === emojiUuid);
  }

  // ...existing code...
  reactToReply(replyUuid: string, emojiTypeUuid: string, forceChange: boolean = false) {
    if (this.selectedReactions[replyUuid] && !forceChange) {
      this.removeReplyReaction(replyUuid);
      return;
    }
    const body = {
      emoji_type_id: emojiTypeUuid, // <-- nombre correcto
      reaction_date: new Date().toISOString() // <-- nombre correcto
    };
    this.postService.reactToReply(replyUuid, body)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      this.selectedReactions[replyUuid] = emojiTypeUuid;
      this.loadRepliesReactionsCount();
    });
  }

  removeReplyReaction(replyUuid: string) {
    this.postService.deleteReplyReaction(replyUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
      this.selectedReactions[replyUuid] = '';
      this.loadRepliesReactionsCount();
    });
  }

  loadUserReactionsForReplies() {
    const userId = this.authService.getUserId();
    if (!userId || !this.replies) return;
    const reactionsObservables = this.replies.map(reply =>
      this.postService.getReplyReactions(reply.uuid)
    );
    forkJoin(reactionsObservables)
      .pipe(takeUntil(this.destroy$))
      .subscribe(allReactions => {
      allReactions.forEach((reactions, idx) => {
        const reply = this.replies[idx];
        // Cambia a user_id y emoji_type_id
        const myReaction = reactions.find((r: any) => r.user_id === userId);
        if (myReaction) {
          this.selectedReactions[reply.uuid] = myReaction.emoji_type_id;
        } else {
          this.selectedReactions[reply.uuid] = '';
        }
      });
    });
  }

  loadRepliesReactionsCount() {
    if (!this.replies) return;
    this.replies.forEach(reply => {
      this.postService.getReplyReactions(reply.uuid)
        .pipe(takeUntil(this.destroy$))
        .subscribe(reactions => {
          this.replyReactionsCount[reply.uuid] = reactions.length;
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getReplyReactionsCount(reply: any): number {
    return this.replyReactionsCount[reply.uuid] || 0;
  }
  // Devuelve el límite de respuestas a mostrar para un uuid
  getLimit(uuid: string): number {
    return this.replyLimit && this.replyLimit[uuid] ? this.replyLimit[uuid] : 0;
  }

  // Calcula el tiempo desde la fecha
  calculateTimeFromNow(date: string): string {
    return moment.utc(date).local().fromNow();
  }
  openReplyReactionsModal(replyUuid: string) {
    this.postService.getReplyReactions(replyUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe(reactions => {
      // Mapea los datos para el modal
      const detailReactions = reactions.map((r: any) => ({
        userName: r.userName,
        userPhoto: r.userPhoto,
        emoji: this.emojis.find(e => e.uuid === r.emoji_type_id)?.emoji_code || ''
      }));

      // Calcula el conteo de reacciones por tipo de emoji
      const reactionsCount = this.emojis
        .map(e => ({
          emojiTypeId: e.uuid,
          emoji: e.emoji_code,
          count: reactions.filter((r: any) => r.emoji_type_id === e.uuid).length
        }))
        .filter(rc => rc.count > 0);

      const modalRef = this.modalService.open(ModalListReactionsRepliesComponent, { size: 'md' });
      modalRef.componentInstance.detailReactions = detailReactions;
      modalRef.componentInstance.listEmojiType = this.emojis;
      modalRef.componentInstance.commentOrReplyUuid = replyUuid;
      modalRef.componentInstance.reactionsCount = reactionsCount; 
    });
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/default-avatar.png';
  }
  
  showModalDeleteReply(currentReply: Reply, indexReply: number): void {
    this.replyToDelete = currentReply;
    this.indexReplyToDelete = indexReply;
    this.visibleModalDeleteReply = true;
  }

  deleteReply(): void {
    if(!this.replyToDelete) return;

    this.isLoadingDeleteRyply = true;
    this.postService.deleteReply(this.replyToDelete.uuid).subscribe({
      next: () => {
        this.isLoadingDeleteRyply = false;
        this.visibleModalDeleteReply = false;
        this.replies.splice(this.indexReplyToDelete, 1);
        this.replyToDelete = null;
        this.indexReplyToDelete = -1;
        this.toastRef.showSuccess('Respuesta eliminada exitosamente', 'Éxito');
      },
      error: (error: HttpErrorResponse) => {
        this.isLoadingDeleteRyply = false;
        this.toastRef.showError('Error al eliminar la respuesta', 'Error');
        console.log('Error al eliminar la respuesta', error);
      }
    })
  }
}