import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';

import { RootDashboardRoutingModule } from './root-dashboard-routing.module';
import { SharedModule } from '../shared/shared.module';

import { RootLoginComponent } from './components/root-login/root-login.component';
import { RootLayoutComponent } from './components/root-layout/root-layout.component';
import { InstitutionListComponent } from './components/institution-list/institution-list.component';
import { InstitutionCreateModalComponent } from './components/institution-create-modal/institution-create-modal.component';
import { InstitutionDetailComponent } from './components/institution-detail/institution-detail.component';
import { AdminUsersTableComponent } from './components/admin-users-table/admin-users-table.component';
import { FacebookConfigComponent } from './components/facebook-config/facebook-config.component';
import { UiButtonDemoComponent } from './components/ui-button-demo/ui-button-demo.component';

@NgModule({
  declarations: [
    RootLoginComponent,
    RootLayoutComponent,
    InstitutionListComponent,
    InstitutionCreateModalComponent,
    InstitutionDetailComponent,
    AdminUsersTableComponent,
    FacebookConfigComponent,
    UiButtonDemoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RootDashboardRoutingModule,
    SharedModule
  ],
  providers: [
    MessageService,
    ConfirmationService
  ]
})
export class RootDashboardModule {}
