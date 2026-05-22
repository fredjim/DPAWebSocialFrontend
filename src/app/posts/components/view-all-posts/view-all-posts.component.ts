import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { Post } from '../../models/post';
import { UserDetail } from '../../models/user-detail';
import { Institution } from '../../models/institution';
import { TenantService } from '../../../services/tenant.service';
import { delay, distinctUntilChanged, fromEvent, Subject, takeUntil, throttleTime } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from '../comments/comments.component';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-view-all-posts',
  templateUrl: './view-all-posts.component.html',
  styleUrl: './view-all-posts.component.scss'
})
export class ViewAllPostsComponent implements OnInit, OnDestroy {
  @ViewChild('sidebar') sidebarRef!: ElementRef;
  sidebarStyle: any = { top: '80px' };
  private sidebarTopOffset = 80;
  private lastScrollTop = 0;

  authenticated: boolean = false;
  posts: Post[] = [];
  currentUser!: UserDetail;
  currentInstitution!: Institution;
  selectedPostReactions: any = null;
  selectedPostUuid: string = '';
  loading = false;
  pageCounter = 0;
  showScrollButton = false;
  hasMorePosts = true;
  private readonly scrollThreshold = 300;
  private readonly destroy$ = new Subject<void>();
  private readonly loadThreshold = 100; // Pixeles antes del final para cargar
  private readonly throttleTimeMs = 200; // Tiempo para throttling
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  constructor(
    private readonly postService: PostService,
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly modalService: NgbModal,
    private readonly location: Location
  ){}
  
  ngOnInit(){
    this.setupScrollListener();
    this.authenticated = this.authService.isAuthenticated();

    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
      const postId = params.get('id');
      if (postId) {
        const state = globalThis.history.state as { initialImageIndex?: number };
        const initialImageIndex = state?.initialImageIndex ?? 0;
        this.openPostById(postId, initialImageIndex);
      }
    });
    // Cargar primera página, carga inicial
    this.loadPosts(true);

    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe(institution => {
        this.currentInstitution = institution;
      });

    if(this.authenticated === true) {
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:(user: UserDetail) => {
            this.currentUser = user;
          },
          error:(error) => {
            console.error('Error al obtener el usuario actual', error);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupScrollListener(): void {
    // Listener original para carga de posts y botón "ir arriba" (con throttle)
    fromEvent(globalThis, 'scroll')
      .pipe(
        throttleTime(this.throttleTimeMs, undefined, { leading: true, trailing: true }),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        const yOffset = window.pageYOffset || document.documentElement.scrollTop;
        this.showScrollButton = yOffset > this.scrollThreshold;
        this.checkForMorePosts();
      });

    fromEvent(globalThis, 'scroll')
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // Calculamos cuánto se movió el scroll (positivo si bajó, negativo si subió)
        const scrollDelta = currentScrollTop - this.lastScrollTop;
        this.lastScrollTop = currentScrollTop;
        
        this.updateSidebarPosition(scrollDelta);
      });
  }

  /* Metodo para el sidebar scrolling en ver todos los posts*/
  private updateSidebarPosition(scrollDelta: number): void {
    if (!this.sidebarRef) return;
    
    const sidebarElement = this.sidebarRef.nativeElement;
    const sidebarHeight = sidebarElement.offsetHeight;
    const viewportHeight = window.innerHeight;
    const HEADER_HEIGHT = 80; 
    const BOTTOM_PADDING = 20; 

    if (sidebarHeight <= viewportHeight - HEADER_HEIGHT) {
      this.sidebarTopOffset = HEADER_HEIGHT;
    } else {
      this.sidebarTopOffset -= scrollDelta;
      
      if (this.sidebarTopOffset > HEADER_HEIGHT) {
        this.sidebarTopOffset = HEADER_HEIGHT;
      }

      const minTop = viewportHeight - sidebarHeight - BOTTOM_PADDING;
      if (this.sidebarTopOffset < minTop) {
        this.sidebarTopOffset = minTop;
      }
    }

    this.sidebarStyle = { top: `${this.sidebarTopOffset}px` };
  }

  private handleScroll(): void {
    // 1. Controlar visibilidad del botón "ir arriba"
    const yOffset = window.pageYOffset || document.documentElement.scrollTop;
    this.showScrollButton = yOffset > this.scrollThreshold;
    
    // 2. Verificar si debemos cargar más posts
    this.checkForMorePosts();
  }

  private checkForMorePosts(): void {
    // Si ya está cargando, no hay más posts, o estamos en carga inicial - no hacer nada
    if (this.loading || !this.hasMorePosts) return;
    
    // Calcular posición actual
    const scrollPosition = window.innerHeight + window.scrollY;
    // Usar el elemento scrollable correcto
    const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
    
    // Verificar si estamos cerca del final
    if (scrollPosition >= scrollHeight - this.loadThreshold) {
      this.loadPosts();
    }
  }

  scrollToTopSmooth() {
    window.scroll({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }

  loadPosts(reset: boolean = false): void {
    // No cargar si ya está cargando o no hay más posts (excepto cuando se resetea)
    if (this.loading || (!this.hasMorePosts && !reset)) return;
    
    this.loading = true;

    // Si es reset, reiniciamos pageCounter
    if (reset) {
      this.pageCounter = 0;
      this.hasMorePosts = true;
    }

    this.postService.getPagedPosts(this.pageCounter)
      .pipe(
        takeUntil(this.destroy$),
        // Pequeño delay para evitar múltiples llamadas consecutivas
        delay(100)
      )
      .subscribe({
        next: (data: Post[]) => {
          // VERIFICAR DUPLICADOS: Si hay posts nuevos, evitar duplicados por ID
          if (reset) {
            this.posts = data;
          } else {
            // Filtrar posts que ya existen para evitar duplicados
            const existingUuids = new Set(this.posts.map(p => p.uuid));
            const newPosts = data.filter(post => !existingUuids.has(post.uuid));
            this.posts = [...this.posts, ...newPosts];
          }
          
          // Verificar si hay más posts (si recibimos menos de 5, asumimos que es el final)
          this.hasMorePosts = data.length === 5; // Asumiendo que size=5
          
          this.pageCounter = reset ? 1 : this.pageCounter + 1;
          this.loading = false;
        },
        error: (error) => {
          console.error('Error al obtener los posts paginados', error);
          this.loading = false;
          // Deshabilitar más intentos si el error es 404 o similar
          if (error.status === 404) {
            this.hasMorePosts = false;
          }
        }
      });
  }

  deletePost(postUuid: string) {
    this.postService.deletePost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastRef.showSuccess('Publicación eliminada exitosamente', 'Éxito');
          this.posts = this.posts.filter(post => post.uuid !== postUuid);
        },
        error: (error) => {
          this.toastRef.showError('Error al eliminar publicación', 'Error');
          console.log('Error al eliminar el post',error);
        }
      });
  }

  createdNewPost(newPost: Post): void {
    this.posts.unshift(newPost);
  }

  updatePost(postUpdated: Post){
    // Actualizar el post en la lista local
    this.posts = this.posts.map(post => 
      post.uuid === postUpdated.uuid ? postUpdated : post
    );
  }

  updateReactions(postUuid: string) {
    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => {
          const index = this.posts.findIndex(p => p.uuid === postUuid);
          if (index !== -1) {
            this.posts[index].reactions = post.reactions;
          }
        },
        error: (error) => {
          console.error('Error al actualizar las reacciones', error);
        }
      });
  }

  handleOpenPost(post: Post, initialMediaIndex: number = 0): void {
    const slug = this.tenantService.getSlug();
    const url = this.router.createUrlTree(['/', slug, 'posts', post.uuid]).toString();
    this.location.go(url);
    this.openPostModal(post, initialMediaIndex);
  }

  private openPostById(postUuid: string, initialImageIndex: number = 0): void {
    const existing = this.posts.find(p => p.uuid === postUuid);
    if (existing) {
      this.openPostModal(existing, initialImageIndex);
      return;
    }

    this.postService.getPost(postUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (post) => this.openPostModal(post, initialImageIndex),
        error: (error) => console.error('Error al obtener el post', error)
      });
  }

  private openPostModal(post: Post, initialMediaIndex: number = 0): void {
    this.postService.getInstitution(post.institution_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institution) => {
          const modalRef = this.modalService.open(CommentsComponent, { size: 'lg', centered: true });
          modalRef.componentInstance.institution = institution;
          modalRef.componentInstance.post = post;
          modalRef.componentInstance.postUuid = post.uuid;
          modalRef.componentInstance.postMedia = post.content.media;
          modalRef.componentInstance.postAuthor = institution.name;
          modalRef.componentInstance.postDate = this.calculateTimePost(post);
          modalRef.componentInstance.postDescription = post.content.text;
          modalRef.componentInstance.initialMediaIndex = initialMediaIndex;

          const resetUrl = () => {
            const slug = this.tenantService.getSlug();
            const url = this.router.createUrlTree(['/', slug, 'posts']).toString();
            this.location.go(url);
          };

          modalRef.closed.pipe(takeUntil(this.destroy$)).subscribe(() => resetUrl());
          modalRef.dismissed.pipe(takeUntil(this.destroy$)).subscribe(() => resetUrl());
        },
        error: (error) => console.error('Error al obtener la institucion', error)
      });
  }

  private calculateTimePost(post: Post): string {
    const postDate = new Date(post.date);
    const currentDate = new Date(Date.now());
    const diferenciaMs: number = currentDate.getTime() - postDate.getTime();
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
    }

    return postDate.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}