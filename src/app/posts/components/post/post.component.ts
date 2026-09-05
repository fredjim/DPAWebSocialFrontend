import { Component, EventEmitter, Input, Output, signal, WritableSignal, inject, OnInit, HostListener } from '@angular/core';
import { ReactionService } from '../../../interactions/services/reaction.service';
import { CreateReaction } from '../../../shared/models/create-reaction';
import { Post } from '../../models/post';
import { Institution } from '../../../shared/models/institution';
import { Media } from '../../../shared/models/media';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from '../../../interactions/components/comments/comments.component';
import { UserDetail } from '../../../shared/models/user-detail';
import { EmojiName, EmojiType, EmojiTypeExtended, TranslatedName } from '../../../shared/models/emoji-type';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrl: './post.component.scss'
})
export class PostComponent implements OnInit {
  private readonly modalService = inject(NgbModal);
  @Input({ required: true }) post!: Post;
  @Output() reactionChanged = new EventEmitter<void>(); // Nuevo Output para emitir eventos de cambio de reacción
  @Input() currentUser: UserDetail | null = null;
  @Input() institution!: Institution;
  @Input() openInParent: boolean = false;

  @Output() requestDeletePost = new EventEmitter<string>();
  @Output() requestUpdatePost = new EventEmitter<Post>();
  @Output() openPostDetail = new EventEmitter<{ post: Post; initialMediaIndex: number }>();
  listMediaPost!: Media[]; // Lista de imagenes videos del post 
  listDocsPost!: Media[]; // Lista de documentos del post 
  showOptionsPost: WritableSignal<boolean> = signal(false); // Controla la visibilidad de las opciones del post
  openModalEdit: WritableSignal<boolean> = signal(false);
  private readonly LIMIT_EXTENDED_TEXT: number = 480;
  expandedPosts = new Set<string>(); // guarda los uuid de posts expandidos
  like = false
  myReaction = {
    class: 'default',
    emoji: 'fa-regular fa-thumbs-up',
    name: 'Me gusta'
  };

  listEmojiTypeExtended: EmojiTypeExtended[] = [];
  mapEmojiTypeExtended = new Map<EmojiName, EmojiTypeExtended>();
  // Mapa de traducciones
  private readonly translations: Record<EmojiName, TranslatedName> = {
    'thumbs-up': 'Me gusta',
    'red-heart': 'Me encanta',
    'crying-face': 'Me entristece',
    'angry-face': 'Me enoja',
    'grinning-squinting-face': 'Me divierte',
    'astonished-face': 'Me asombra'
  };

  typeImages = ['image', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  typeVideos = ['video', 'video/mp4'];
  totalReactions = signal(0);
  totalComments = signal(0);

  // Reactiones para vista mobil-touch
  showOptionsReactions = signal(false);
  private longPressTimer?: ReturnType<typeof setTimeout>;
  private readonly LONG_PRESS_MS = 400;

  constructor(
    private readonly reactionService: ReactionService
  ) {}
  
  ngOnInit() {
    this.listMediaPost = this.loadMediaPost();
    this.listDocsPost = this.loadDocsPost();
    this.getEmojis();

    this.totalComments.set(this.post.commentCounter.totalComments);
  }

  private getEmojis() {
    this.reactionService.getEmojisType().subscribe((emojis: EmojiType[]) => {
      // Transformar cada emoji agregando la traducción
      const emojisExtended = this.extendEmojisWithTranslation(emojis);
      
      // Asignar a la lista
      this.listEmojiTypeExtended = emojisExtended;
      
      // Crear el Map con las claves correctas
      this.mapEmojiTypeExtended = new Map(
          emojisExtended.map(emoji => [emoji.emoji_name, emoji])
      );

      if (this.post.reactions) {
        this.totalReactions.set(this.post.reactions.total_reactions);
        this.recoverReaction();
      } else {
        console.warn("Advertencia: this.post.reactions es undefined");
      }
    });
  }

  private extendEmojisWithTranslation(emojis: EmojiType[]): EmojiTypeExtended[] {
    return emojis.map(emoji => ({
      ...emoji,
      name_translated: this.translations[emoji.emoji_name]
    }));
  }
    
  deletePost(confirm: boolean) {
    if (confirm) {
      this.requestDeletePost.emit(this.post.uuid);
    }
  }

  updatePost(postUpdated: Post) {
    this.requestUpdatePost.emit(postUpdated);
  }

  //Enviar copia del post para editar
  sendCopyPost(): Post {
    const copyPost: Post = { ...this.post };
    return copyPost;
  }

  openViewPostComments(post: Post, initialMediaIndex: number = 0) {
    if (this.openInParent) {
      this.openPostDetail.emit({ post, initialMediaIndex });
      return;
    }
    const modalRef = this.modalService.open(CommentsComponent, { size: 'lg', centered: true });
    modalRef.componentInstance.institution = this.institution;
    modalRef.componentInstance.post = post;
    modalRef.componentInstance.initialMediaIndex = initialMediaIndex;
    modalRef.dismissed.subscribe(() => {
      this.totalComments.set(modalRef.componentInstance.comments.length);
    });
  }

  getGridClass(media: Media[]): string {
    if (media.length === 1) return 'single';
    if (media.length === 2) return 'two';
    if (media.length === 3) return 'three';
    return 'four';
  }

  // Cargar las imagenes o videos del post
  loadMediaPost() {
    let mediaOfPost: Media[] = []
    for (const media of this.post.content.media) {
      if(media.type !== 'document') 
        mediaOfPost.push(media);
    }
    return mediaOfPost;
  }

  // Cargar las imagenes o videos del post
  loadDocsPost() {
    let docsOfPost: Media[] = []
    for (const media of this.post.content.media) {
      if(media.type === 'document') 
        docsOfPost.push(media);
    }
    return docsOfPost;
  }

  calculateTimePost() {
    const postDate = new Date(this.post.date)
    const currentDate = new Date(Date.now());
    const diferenciaMs: number = currentDate.getTime() - postDate.getTime(); // Diferencia en milisegundos
    const unMinuto = 60 * 1000;
    const unaHora = 60 * unMinuto;
    const unDia = 24 * unaHora;
    const sieteDias = 7 * unDia;

    if (diferenciaMs < unMinuto) {
      return 'Hace un momento';
    } else if (diferenciaMs < unaHora) {
      const minutos = Math.floor(diferenciaMs / unMinuto);
      return `Hace ${minutos} min`;
    } else if (diferenciaMs < unDia) {
      const horas = Math.floor(diferenciaMs / unaHora);
      return `Hace ${horas} h`;
    } else if (diferenciaMs < sieteDias) {
      const dias = Math.floor(diferenciaMs / unDia);
      return `Hace ${dias} d`;

    } else {
      const opciones: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      };
      return postDate.toLocaleDateString('es-ES', opciones);
    }
  }


  reactUserBoton(postUuid: string, emojiType: EmojiType | undefined) {
    if (!this.like && emojiType) { //No seleccionaron ningun emoji por default Me gusta
      
      this.react(postUuid, emojiType.uuid)
      this.myReaction = {
        class: 'thumbs-up',
        emoji: 'fa-solid fa-thumbs-up',
        name: 'Me gusta'
      }
      this.incrementTotalReactions()
    } else {
      // Si reaccionaron y hacen click en el boton quitar la reaccion
      this.removeReaction(postUuid);
    }
  }

  removeReaction(postUuid: string) {
    this.reactionService.deletePostReaction(postUuid).subscribe({
      next: () => {
        this.like = false;
        this.myReaction = {
          class: 'default',
          emoji: 'fa-regular fa-thumbs-up',
          name: 'Me gusta'
        };
        this.totalReactions.update(valor => valor - 1);
        this.reactionChanged.emit(); // Emitir evento de cambio de reacción
      },
      error: (error) => {
        console.log('No se pudo eliminar la reacción', error);
      }
    });
  }
  
  getTypeDoc(typeDoc: string) {
    if (typeDoc == 'application/pdf')
      return 'PDF';
    else if (typeDoc == 'application/pptx')
      return 'PRESENTACIÓN';
    else
      return 'DOCUMENTO';
  }

  amountReactions() {
    return this.totalReactions();
  }

  amountComments() {
    return this.totalComments();
  }

  private recoverReaction() {
    let reactionUser = this.post.reactions.my_reaction_emoji;
    if (reactionUser) {
      this.like = true;
      this.myReaction = {
        class: reactionUser,
        emoji: reactionUser === 'thumbs-up' ? 
                'fa-solid fa-thumbs-up' :
                this.mapEmojiTypeExtended.get(reactionUser as EmojiName)?.emoji_code || '',
        name: this.mapEmojiTypeExtended.get(reactionUser as EmojiName)?.name_translated || '',
      };
    } else {
      this.like = false;
    }
  }

  clickReaction(postUuid: string, typeReaction: EmojiName, event: Event) {
    event.stopPropagation(); // Detener la propagación del evento de clic
    this.showOptionsReactions.set(false);
    let emojiUuid = this.mapEmojiTypeExtended.get(typeReaction)?.uuid || '';
    
    this.myReaction = {
      class: typeReaction,
      emoji: typeReaction === 'thumbs-up' ? 
              'fa-solid fa-thumbs-up' :
              this.mapEmojiTypeExtended.get(typeReaction)?.emoji_code || '',
      name: this.mapEmojiTypeExtended.get(typeReaction)?.name_translated || ''
    }

    this.react(postUuid, emojiUuid)
    this.incrementTotalReactions()
  }

  //Metodo para aumentar o no el totalReactions
  incrementTotalReactions() {
    if(this.like) {
      this.totalReactions.update(valor => valor)
    }else{
      this.totalReactions.update(valor => valor + 1)
    }
  }

  react(postUuid: string, emoji_id: string) {
    const newReaction: CreateReaction = {
      "emoji_type_id": emoji_id,
      "reaction_date": new Date().toISOString()
    }
    this.reactionService.reactToPost(postUuid, newReaction).subscribe({
      next: () => {
        this.like = true;
        //this.totalReactions.update(valor => valor + 1)
        this.reactionChanged.emit(); // Emitir evento de cambio de reacción
      },
      error: (error) => {
        console.log('No se pudo reaccionar', error)
      }
    })
  }

  allowedTextLength(){
    return this.post.content.text.length <= this.LIMIT_EXTENDED_TEXT;
  }

  isExpanded(id: string): boolean {
    return this.expandedPosts.has(id);
  }

  adjustedTextLength(): string {
    const text = this.post.content.text;
    const cut = this.safeSliceIndex(text, 480);
    return text.slice(0, cut) + '... ';
  }

  showAllText(id: string): void {
    this.expandedPosts.add(id);
  }

  // Evita cortar en medio de una URL/email: si el corte cae dentro de un
  // token sin espacios (como una URL larga), retrocede hasta el espacio anterior.
  private safeSliceIndex(text: string, maxIndex: number): number {
    if (maxIndex >= text.length) return text.length;

    const isInsideToken = text[maxIndex] !== ' ' && text[maxIndex - 1] !== ' ';
    if (!isInsideToken) return maxIndex;

    const lastSpace = text.lastIndexOf(' ', maxIndex);
    return lastSpace > -1 ? lastSpace : maxIndex;
  }

  onShare() {
    const shareUrl = this.buildPostUrl(this.post.uuid);
    if (navigator.share) {
      navigator.share({
        title: 'Mira esta publicación',
        url: shareUrl
      }).catch(() => { });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert('URL copiada al portapapeles');
      });
    }
  }

  private buildPostUrl(postUuid: string): string {
    const base = window.location.hostname;
    return `${base}/posts/${postUuid}`;
  }

  onTouchStart(uuid: string, event: TouchEvent) {
    this.longPressTimer = setTimeout(() => {
      this.showOptionsReactions.set(true);
    }, this.LONG_PRESS_MS);
  }

  onTouchEnd() {
    this.cancelLongPress();
  }

  cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = undefined;
    }
  }

  onButtonClick(uuid: string) {
    // Si las opciones ya están abiertas (por long-press), un click normal
    // no debería disparar el "me gusta" por defecto
    if (this.showOptionsReactions()) {
      return;
    }
    this.reactUserBoton(uuid, this.mapEmojiTypeExtended.get('thumbs-up'));
  }

  @HostListener('document:touchstart', ['$event'])
  onDocumentTouch(event: TouchEvent) {
    if (!(event.target as HTMLElement).closest('#btn-reaction') && this.showOptionsReactions()) {
      this.showOptionsReactions.set(false);
    }
  }
}