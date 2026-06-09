import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  hideHero = false;
  hideNavbar = false;
  showGoBack = false;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.checkRoute();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      const child = this.activatedRoute.firstChild;
      this.hideHero = child?.snapshot.data['hideHero'] ?? false;
      this.hideNavbar = child?.snapshot.data['hideNavbar'] ?? false;
      this.showGoBack = child?.snapshot.data['showGoBack'] ?? false;
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private checkRoute() {
    const child = this.activatedRoute.firstChild;
    this.hideHero = child?.snapshot.data['hideHero'] ?? false;
    this.hideNavbar = child?.snapshot.data['hideNavbar'] ?? false;
    this.showGoBack = child?.snapshot.data['showGoBack'] ?? false;
  }
}
