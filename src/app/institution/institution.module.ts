import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileInstitutionComponent } from './components/profile-institution/profile-institution.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from "../app-routing.module";
import { AppModule } from '../app.module';



@NgModule({
  declarations: [
    ProfileInstitutionComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AppRoutingModule,
    AppModule
]
})
export class InstitutionModule { }
