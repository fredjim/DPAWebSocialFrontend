import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Institution } from '../../posts/models/institution';
import { PostService } from '../../posts/services/post.service';
import { TenantService } from '../../services/tenant.service';
import { filter, Subscription } from 'rxjs';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-hero-profile',
  templateUrl: './hero-profile.component.html',
  styleUrl: './hero-profile.component.scss'
})
export class HeroProfileComponent implements OnInit, OnDestroy {
  institution!: Institution;
  screenWidth!: number;
  showHero = true;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly postService: PostService,
    private readonly tenantService: TenantService,
    private readonly router: Router
  ) {}

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.getInstitutionData();
    
    // Suscribirse a cambios de ruta
    this.subscribeToRouteChanges();
    
    // Evaluar condiciones iniciales
    this.showHero = this.checkConditions();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
    this.updateShowHero();
  }

  private subscribeToRouteChanges(): void {
    const routeSubscription = this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.updateShowHero();
      });
    
    this.subscriptions.add(routeSubscription);
  }

  private updateShowHero(): void {
    this.showHero = this.checkConditions();
  }

  private checkConditions(): boolean {
    const isMobile = this.screenWidth >= 768;
    return isMobile || this.shouldRender;
  }

  get shouldRender(): boolean {
    return this.router.url.includes('/posts');
  }

  getInstitutionData() {
    const dataSubscription = this.tenantService.getInstitution().subscribe({
      next: (dataInstitution: Institution) => {
        this.institution = dataInstitution;
      },
      error: (error) => {
        console.log(error);
      }
    });

    this.subscriptions.add(dataSubscription);
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.subscriptions.unsubscribe();
  }
}
