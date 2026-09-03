import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileComponent } from './components/profile/profile.component';
import { ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from "primeng/inputtext";
import { RouterModule } from '@angular/router';
import { UserProfileRoutingModule } from './user-profile-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    ProfileComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    RouterModule,
    UserProfileRoutingModule,
    SharedModule
  ],
  exports: [ProfileComponent]
})
export class UserProfileModule { }
