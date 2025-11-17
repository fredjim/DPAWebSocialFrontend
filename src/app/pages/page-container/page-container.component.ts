import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../services/information.service';
import { ActivatedRoute } from '@angular/router';
import { NavItem } from '../models/nav-item';

@Component({
  selector: 'app-page-container',
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss',
 
})
export class PageContainerComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly route = inject(ActivatedRoute);

  public selectedNavItemId!: string | null;
  public currentNavItem!: NavItem;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.selectedNavItemId = params.get('uuidNavItem');
      if (this.selectedNavItemId) {
        this.informationService.getNavItemById(this.selectedNavItemId).subscribe(navItem => {
          this.currentNavItem = navItem;
        });
      }
    });
  }
}
