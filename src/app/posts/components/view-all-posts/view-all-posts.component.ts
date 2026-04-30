import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/post.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { Post } from '../../models/post';
import { UserDetail } from '../../models/user-detail';
import { Institution } from '../../models/institution';
import { TenantService } from '../../../services/tenant.service';
import { distinctUntilChanged, fromEvent, Subscription, throttleTime } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommentsComponent } from '../comments/comments.component';

@Component({
  selector: 'app-view-all-posts',
  templateUrl: './view-all-posts.component.html',
  styleUrl: './view-all-posts.component.scss'
})
export class ViewAllPostsComponent implements OnInit, OnDestroy {
  authenticated: boolean = false;
  posts: Post[] = [];
  currentUser!: UserDetail;
  currentInstitution!: Institution;
  selectedPostReactions: any = null;
  selectedPostUuid: string = '';
  loading = false;
  pageCounter = 0;
  showScrollButton = false;
  private readonly scrollThreshold = 300;
  private scrollSubscription!: Subscription;
  private readonly loadThreshold = 100; // Pixeles antes del final para cargar
  private readonly throttleTimeMs = 200; // Tiempo para throttling

  constructor(
    private readonly postService: PostService,
    private readonly authService: AuthService,
    private readonly tenantService: TenantService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly modalService: NgbModal
  ){}
  
  ngOnInit(){
    this.setupScrollListener();
    this.authenticated = this.authService.isAuthenticated();

    this.route.paramMap.subscribe(params => {
      const postId = params.get('id');
      if (postId) {
        const state = window.history.state as { initialImageIndex?: number };
        const initialImageIndex = state?.initialImageIndex ?? 0;
        this.openPostById(postId, initialImageIndex);
      }
    });
    // Obtener una cantidad de posts
    this.postService.getPagedPosts(this.pageCounter).subscribe({
      next:(data: Post[])=>{
        this.posts = data;
        this.postService.getPagedPosts(this.pageCounter++); // Avanza a la siguiente página
      },
      error:(error) => {
        console.error('Error al obtener los posts paginados', error);
      }
    });

    this.tenantService.getInstitution().subscribe(institution => {
      this.currentInstitution = institution;
    });

    if(this.authenticated === true) {
      this.postService.getUser().subscribe({
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
    if (this.scrollSubscription) {
      this.scrollSubscription.unsubscribe();
    }
  }

  private setupScrollListener(): void {
    this.scrollSubscription = fromEvent(globalThis, 'scroll')
      .pipe(
        throttleTime(this.throttleTimeMs, undefined, { leading: true, trailing: true }),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.handleScroll();
      });
  }

  private handleScroll(): void {
    // 1. Controlar visibilidad del botón "ir arriba"
    const yOffset = window.pageYOffset || document.documentElement.scrollTop;
    this.showScrollButton = yOffset > this.scrollThreshold;
    
    // 2. Verificar si debemos cargar más posts
    this.checkForMorePosts();
  }

  private checkForMorePosts(): void {
    // Si ya está cargando, no hacer nada
    if (this.loading) return;
    
    // Calcular posición actual
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.body.offsetHeight;
    
    // Verificar si estamos cerca del final
    if (scrollPosition >= documentHeight - this.loadThreshold) {
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

  loadPosts(): void {
    if (this.loading) return;
    this.loading = true;

    this.postService.getPagedPosts(this.pageCounter).subscribe({
      next: (data: Post[]) => {
        this.posts = [...this.posts, ...data]; // Agrega nuevos posts a la lista
        this.postService.getPagedPosts(this.pageCounter++); // Avanza a la siguiente página
        this.loading = false;
      },
      error: (error) => {
        console.log('Error al obtener los posts paginados', error)
      }
    });
  }

  deletePost(postUuid: string) {
    this.postService.deletePost(postUuid).subscribe({
      next: (response) => {
        // Actualizar la lista localmente
        console.log('post eliminado');
        this.posts = this.posts.filter(post => post.uuid !== postUuid);
      },
      error: (error) => {
        console.log('Error al eliminar el post',error);
      }
    });
  }

  updatePost(postUpdated: Post){
    // Actualizar el post en la lista local
    this.posts = this.posts.map(post => 
      post.uuid === postUpdated.uuid ? postUpdated : post
    );
  }

  updateReactions(postUuid: string) {
    this.postService.getPost(postUuid).subscribe({
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

  handleOpenPost(post: Post, initialImageIndex: number = 0): void {
    this.navigateToPost(post.uuid, initialImageIndex);
  }

  private openPostById(postUuid: string, initialImageIndex: number = 0): void {
    const existing = this.posts.find(p => p.uuid === postUuid);
    if (existing) {
      this.openPostModal(existing, initialImageIndex);
      return;
    }

    this.postService.getPost(postUuid).subscribe({
      next: (post) => this.openPostModal(post, initialImageIndex),
      error: (error) => console.error('Error al obtener el post', error)
    });
  }

  private openPostModal(post: Post, initialImageIndex: number = 0): void {
    this.postService.getInstitution(post.institution_id).subscribe({
      next: (institution) => {
        const modalRef = this.modalService.open(CommentsComponent, { size: 'lg', centered: true });
        modalRef.componentInstance.institution = institution;
        modalRef.componentInstance.post = post;
        modalRef.componentInstance.postUuid = post.uuid;
        modalRef.componentInstance.postImages = post.content.media;
        modalRef.componentInstance.postAuthor = institution.name;
        modalRef.componentInstance.postDate = this.calculateTimePost(post);
        modalRef.componentInstance.postDescription = post.content.text;
        modalRef.componentInstance.initialImageIndex = initialImageIndex;

        modalRef.closed.subscribe(() => this.navigateToPosts());
        modalRef.dismissed.subscribe(() => this.navigateToPosts());
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

  private navigateToPost(postUuid: string, initialImageIndex: number = 0): void {
    const slug = this.tenantService.getSlug();
    this.router.navigate(['/', slug, 'posts', postUuid], {
      state: { initialImageIndex }
    });
  }

  private navigateToPosts(): void {
    const slug = this.tenantService.getSlug();
    this.router.navigate(['/', slug, 'posts']);
  }
}