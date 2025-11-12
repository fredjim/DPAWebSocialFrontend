import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../services/information.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-page-container',
  templateUrl: './page-container.component.html',
  styleUrl: './page-container.component.scss'
})
export class PageContainerComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly route = inject(ActivatedRoute);

  public selectedNavItemId!: string | undefined;

  ngOnInit(): void {
    this.selectedNavItemId = this.route.snapshot.params['uuidNavItem'];
  }
}
