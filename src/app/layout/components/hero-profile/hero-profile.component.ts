import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Institution } from '../../../shared/models/institution';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { TenantInstitutionStateService } from '../../../core/services/tenant-institution-state.service';

@Component({
  selector: 'app-hero-profile',
  templateUrl: './hero-profile.component.html',
  styleUrl: './hero-profile.component.scss'
})
export class HeroProfileComponent implements OnInit, OnDestroy {
  institution!: Institution;
  screenWidth!: number;
  coverImageError = false;
  private readonly subscriptions = new Subscription();

  constructor(
    private readonly tenantInstitutionStateService: TenantInstitutionStateService,
    private readonly router: Router
  ) { }

  ngOnInit() {
    this.screenWidth = window.innerWidth;
    this.getInstitutionData();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.screenWidth = window.innerWidth;
  }

  get shouldRender(): boolean {
    return this.router.url.includes('/posts');
  }

  getInstitutionData() {
    this.subscriptions.add(
      this.tenantInstitutionStateService.currentTenantInstitution$.subscribe({
        next: (dataInstitution) => {
          if(!dataInstitution) return;
          this.institution = dataInstitution;
          this.coverImageError = false;
        },
        error: (error) => {
          console.log(error);
        }
      })
    )
  }

  get hasBackgroundImage(): boolean {
    return !!this.institution?.background_url && 
           this.institution.background_url.trim().length > 0 && 
           this.institution.background_url !== 'null' && 
           !this.coverImageError;
  }

  onCoverError() {
    this.coverImageError = true;
  }

  get hasLogoImage(): boolean {
    return !!this.institution?.logo_url && this.institution.logo_url.trim().length > 0;
  }

  get institutionInitials(): string {
    if (!this.institution?.name) {
      return 'IN';
    }

    const words = this.institution.name
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0);

    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  }

  ngOnDestroy() {
    // Limpiar todas las suscripciones
    this.subscriptions.unsubscribe();
  }
}
