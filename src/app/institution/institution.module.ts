import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInstitutionComponent } from './components/profile-institution/profile-institution.component';
import { InstitutionAdminComponent } from './components/institution-admin/institution-admin.component';
import { InstitutionStudentsTableComponent } from './components/institution-students-table/institution-students-table.component';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { InstitutionRoutingModule } from './institution-routing.module';
import { SharedModule } from '../shared/shared.module';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ConfirmationService } from 'primeng/api';


@NgModule({
  declarations: [
    ProfileInstitutionComponent,
    InstitutionAdminComponent,
    InstitutionStudentsTableComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InstitutionRoutingModule,
    SharedModule,
    InputTextareaModule
  ],
  providers: [ConfirmationService],
  exports: [ProfileInstitutionComponent]
})
export class InstitutionModule { }
