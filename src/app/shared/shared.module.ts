import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TabViewModule } from 'primeng/tabview';
import { ToastModule } from 'primeng/toast';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';

// Shared components
import { CustomTableComponent } from './components/custom-table/custom-table.component';
import { InstitutionAvatarComponent } from './components/institution-avatar/institution-avatar.component';
import { CustomToastComponent } from './components/custom-toast/custom-toast.component';
import { UiButtonComponent } from './components/ui-button/ui-button.component';
import { UserAvatarComponent } from './components/user-avatar/user-avatar.component';
import { LinkifyPipe } from './pipes/linkify.pipe';

@NgModule({
  declarations: [
    CustomTableComponent,
    InstitutionAvatarComponent,
    CustomToastComponent,
    UiButtonComponent,
    UserAvatarComponent,
    LinkifyPipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    MultiSelectModule,
    DropdownModule,
    TagModule,
    ProgressBarModule,
    DialogModule,
    ConfirmDialogModule,
    TabViewModule,
    ToastModule,
    ProgressSpinnerModule,
    InputGroupModule,
    InputGroupAddonModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
    RippleModule,
    TooltipModule,
    MultiSelectModule,
    DropdownModule,
    TagModule,
    ProgressBarModule,
    DialogModule,
    ConfirmDialogModule,
    TabViewModule,
    ToastModule,
    ProgressSpinnerModule,
    InputGroupModule,
    InputGroupAddonModule,
    // Design-system components
    UiButtonComponent,
    CustomTableComponent,
    InstitutionAvatarComponent,
    CustomToastComponent,
    UserAvatarComponent,
    //Pipes
    LinkifyPipe
  ]
})
export class SharedModule { }
