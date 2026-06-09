import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; 
import { SharedModule } from '../shared/shared.module';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { MenuItemsComponent } from './components/menu-items/menu-items.component';
import { SectionsPanelComponent } from './components/sections-panel/sections-panel.component';
import { HeroProfileComponent } from './components/hero-profile/hero-profile.component';
import { SectionFormComponent } from './components/sections-panel/section-form/section-form.component';
import { MenuItemFormComponent } from './components/menu-items/menu-item-form/menu-item-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MenuModule } from 'primeng/menu';
import { DialogModule } from 'primeng/dialog';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { AuthenticationModule } from '../authentication/authentication.module';

@NgModule({
  declarations: [
    HeaderComponent,
    HomeComponent,
    MenuItemsComponent,
    SectionsPanelComponent,
    HeroProfileComponent,
    SectionFormComponent,
    MenuItemFormComponent,
  ],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    NgbModule,
    MenuModule,
    DialogModule,
    ToastModule,
    InputTextModule,
    SharedModule,
    AuthenticationModule
  ],
  exports: [
    HeaderComponent,
    MenuItemsComponent,
    SectionsPanelComponent,
    SectionFormComponent,
    MenuItemFormComponent,
    HeroProfileComponent
  ]
})
export class LayoutModule { }
