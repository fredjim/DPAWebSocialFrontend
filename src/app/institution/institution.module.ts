import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInstitutionComponent } from './components/profile-institution/profile-institution.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from "../app-routing.module";
import { AppModule } from '../app.module';
import { RouterModule } from '@angular/router';
import { InstitutionRoutingModule } from './institution-routing.module';
import { SharedModule } from '../shared/shared.module';
import { InputTextareaModule } from 'primeng/inputtextarea';


@NgModule({
  declarations: [
    ProfileInstitutionComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    InstitutionRoutingModule,
    AppModule,
    AppRoutingModule,
    SharedModule,
    InputTextareaModule
  ]
})
export class InstitutionModule { }
