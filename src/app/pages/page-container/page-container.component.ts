import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { InformationService } from '../services/information.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavItem } from '../models/nav-item';
import { Subscription, switchMap } from 'rxjs';

@Component({
  selector: 'app-page-container',
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss',
 
})
export class PageContainerComponent implements OnInit, OnDestroy {
  private readonly informationService = inject(InformationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscription: Subscription = new Subscription();

  public selectedNavItemPath!: string | null;
  public currentNavItem!: NavItem;

  ngOnInit(): void {
    this.subscription.add(
      this.route.paramMap.pipe(
        switchMap(params => {
          this.selectedNavItemPath = params.get('pathNavItem');
          
          if (this.selectedNavItemPath) {
            // switchMap cancela automáticamente la suscripción anterior
            return this.informationService.getAllNavItems();
          }
          return []; // Retorna un observable vacío si no hay path
        })
      ).subscribe(navItems => {
        const navItemFinded = navItems.find(
          navItem => navItem.path === this.selectedNavItemPath
        );
        
        if (navItemFinded) {
          this.currentNavItem = navItemFinded;
        } else {
          this.router.navigate(['/']);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
