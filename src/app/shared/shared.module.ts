import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
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
import { CustomTableComponent } from './components/custom-table/custom-table.component';
import { InstitutionAvatarComponent } from './components/institution-avatar/institution-avatar.component';

@NgModule({
  declarations: [
    CustomTableComponent,
    InstitutionAvatarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    InputTextModule,
    ButtonModule,
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
    CustomTableComponent,
    InstitutionAvatarComponent
  ]
})
export class SharedModule { }
