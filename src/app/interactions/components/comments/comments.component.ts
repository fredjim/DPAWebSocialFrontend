import { Component, ElementRef, Input, OnInit, ViewChildren, QueryList, AfterViewInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { CommentService } from '../../services/comment.service'; 
import { ReplyService } from '../../services/reply.service'; 
import { UserService } from '../../../user-profile/services/user.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { Comment } from '../../models/comment';
import { Institution } from '../../../shared/models/institution';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Post } from '../../../posts/models/post';
import { UserDetail } from '../../../shared/models/user-detail';
import moment from 'moment-timezone';
import { CreateReply } from '../../models/create-reply';
import { Reply } from '../../models/reply';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
  styleUrls: ['./comments.component.scss'],
})
export class CommentsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() initialMediaIndex: number = 0; // image-video
  @Input() modalBoostrap: boolean = true;
  @ViewChildren('videoPlayer') videos!: QueryList<ElementRef<HTMLVideoElement>>;
  @Input({ required: true }) institution!: Institution;
  @Input({ required: true }) post!: Post;

  newComment: string = '';
  comments: Comment[] = [];
  authenticated: boolean = false;
  currentUser: UserDetail | null = null;

  private readonly destroy$ = new Subject<void>();
  private carouselElement: HTMLElement | null = null;
  private slideEventHandler: any;

  constructor(
    private readonly commentService: CommentService,
    private readonly replyService: ReplyService,
    private readonly userService: UserService,
    public modal: NgbModal,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authenticated = this.authService.isAuthenticated();
    this.loadComments();
    if (this.authenticated) {
      this.loadCurrentUser();
    }
  }

  ngAfterViewInit(): void {
    // Configurar el control de videos después de que la vista esté lista
    setTimeout(() => {
      this.setupVideoControls();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.cleanupVideoControls();
  }

  private setupVideoControls(): void {
    this.carouselElement = document.getElementById('carouselMediaControls');
    
    if (this.carouselElement) {
      this.slideEventHandler = () => this.stopAllVideos();
      this.carouselElement.addEventListener('slide.bs.carousel', this.slideEventHandler);
    }
  }

  private cleanupVideoControls(): void {
    if (this.carouselElement && this.slideEventHandler) {
      this.carouselElement.removeEventListener('slide.bs.carousel', this.slideEventHandler);
    }
    // También detener videos al destruir el componente
    this.stopAllVideos();
  }

  private stopAllVideos(): void {
    if (this.videos) {
      this.videos.forEach(videoRef => {
        const video = videoRef.nativeElement;
        if (video && !video.paused) {
          video.pause();
          // Opcional: reiniciar el video
          // video.currentTime = 0;
        }
      });
    }
  }

  private loadCurrentUser(): void {
    this.userService.getUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user: UserDetail) => {
          this.currentUser = user || null;
        },
        error: (error) => {
          console.error('Error al obtener el usuario actual', error);
          this.currentUser = null;
        },
      });
  }

  addComment(): void {
    if (!this.newComment.trim() || !this.post?.uuid) return;

    const commentData = {
      content: this.newComment,
    };

    this.commentService.addComment(this.post.uuid, commentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (newComment) => {
        if (this.currentUser) {
          this.comments.unshift(newComment);
          this.newComment = '';
        }
      },
      error: (err) => {
        if (err.status === 403) {
          console.error('Los comentarios están desactivados en esta publicación');
        } else {
          console.error('Error al agregar comentario', err);
        }
      },
    });
  }

  handleAddReply(event: { parentUuid: string; replyText: string; isTopLevel: boolean }): void {
    if (!event.replyText.trim()) return;

    const replyData: CreateReply = {
      content: event.replyText,
      parentReplyUuid: event.isTopLevel ? null : event.parentUuid,
    };

    this.replyService.addReply(event.parentUuid, replyData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newReply) => {
          // El nuevo response del backend ya incluye name, lastName y user_photo,
          // por lo tanto, no necesitamos llamar a getUser() nuevamente.

          if (event.isTopLevel) {
            const parentComment = this.comments.find(
              (c) => c.uuid === event.parentUuid
            );
            if (parentComment) {
              parentComment.replies = parentComment.replies || [];
              parentComment.replies.unshift(newReply);
            }
          } else {
            this.updateNestedReplies(this.comments, event.parentUuid, newReply);
          }
        },
        error: (error) => console.error('Error al agregar respuesta:', error),
    });
  }

 

  calculateTimeFromNow(date: string): string {
    return moment.utc(date).local().fromNow();
  }

  calculateTimePost(): string {
    const postDate = new Date(this.post.date);
    const currentDate = new Date();
    const diferenciaMs = currentDate.getTime() - postDate.getTime();
    const unMinuto = 60 * 1000;
    const unaHora = 60 * unMinuto;
    const unDia = 24 * unaHora;
    const sieteDias = 7 * unDia;

    if (diferenciaMs < unMinuto) return 'Hace un momento';
    if (diferenciaMs < unaHora) return `Hace ${Math.floor(diferenciaMs / unMinuto)} min`;
    if (diferenciaMs < unDia) return `Hace ${Math.floor(diferenciaMs / unaHora)} h`;
    if (diferenciaMs < sieteDias) return `Hace ${Math.floor(diferenciaMs / unDia)} d`;
    
    return postDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Modificar loadComments para cargar también las respuestas
  // Agrega este método para cargar respuestas de un comentario
  private loadCommentReplies(comment: Comment): void {
    this.replyService.getRepliesByCommentUuid(comment.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (replies) => {
        comment.replies = replies.sort(
          (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
        // Cargar respuestas anidadas si existen
        if (comment.replies) {
          comment.replies.forEach(reply => {
            if (reply.replies && reply.replies.length > 0) {
              this.loadReplyReplies(reply);
            }
          });
        }
      },
      error: (error) => console.error('Error al obtener respuestas:', error)
    });
  }

  // Método para cargar respuestas de respuestas (anidadas)
  private loadReplyReplies(reply: any): void {
    this.replyService.getRepliesByCommentUuid(reply.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (nestedReplies) => {
        reply.replies = nestedReplies.sort(
          (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
        );
      },
      error: (error) => console.error('Error al obtener respuestas anidadas:', error)
    });
  }

  // Modifica loadComments para cargar también las respuestas
  loadComments(): void {
    this.commentService.getComments(this.post.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
      next: (data: Comment[]) => {
        this.comments = data.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        // Cargar respuestas para cada comentario
        this.comments.forEach(comment => {
          this.loadCommentReplies(comment);
        });
      },
      error: (error) => {
        console.error('Error al obtener comentarios', error);
      },
    });
  }

  // Asegúrate que updateNestedReplies esté correctamente implementado
  private updateNestedReplies(items: any[], parentUuid: string, newReply: Reply): boolean {
    for (const item of items) {
      if (item.uuid === parentUuid) {
        item.replies = item.replies || [];
        item.replies.unshift(newReply);
        return true;
      }
      if (item.replies && item.replies.length > 0) {
        const found = this.updateNestedReplies(item.replies, parentUuid, newReply);
        if (found) return true;
      }
    }
    return false;
  }
}