import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { NavItemService } from '../../services/nav-item.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NavItem } from '../../../shared/models/nav-item';
import { Subscription, switchMap } from 'rxjs';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-page-container',
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss',
 
})
export class PageContainerComponent implements OnInit, OnDestroy {
  private readonly navItemService = inject(NavItemService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tenantService = inject(TenantService);
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
            return this.navItemService.getAllNavItems();
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
          this.router.navigate([`/${this.tenantService.getSlug()}`]);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
