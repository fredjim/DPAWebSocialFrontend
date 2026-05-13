import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { rootGuard } from './guards/root.guard';
import { RootLoginComponent } from './components/root-login/root-login.component';
import { RootLayoutComponent } from './components/root-layout/root-layout.component';
import { InstitutionListComponent } from './components/institution-list/institution-list.component';
import { InstitutionDetailComponent } from './components/institution-detail/institution-detail.component';
import { UiButtonDemoComponent } from './components/ui-button-demo/ui-button-demo.component';

const routes: Routes = [
  { path: 'login', component: RootLoginComponent },
  { path: 'ui-button-demo', component: UiButtonDemoComponent },
  {
    path: '',
    component: RootLayoutComponent,
    canActivate: [rootGuard],
    children: [
      { path: 'dashboard', component: InstitutionListComponent },
      { path: 'institutions/:uuid', component: InstitutionDetailComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RootDashboardRoutingModule {}
