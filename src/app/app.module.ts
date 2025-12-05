import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './authentication/http-interceptors/auth-interceptor';
import { AuthService } from './authentication/services/auth.service';
export function refreshTokenFactory(authService: AuthService) {
  return () => authService.tryRefreshOnStartup();
}
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { AuthenticationModule } from './authentication/authentication.module';
import { PostsModule } from './posts/posts.module';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PagesComponent } from './pages/pages.component';
import { CommentsModule } from "./comments/comments.module";
import { EditorModule } from 'primeng/editor';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { EditInfoComponent } from './pages/edit-info/edit-info.component';
import { ToastModule } from 'primeng/toast';
import { NavbarInformationComponent } from './components/navbar/child/navbar-information/navbar-information.component';
import { NavbarProcedureGuideComponent } from './components/navbar/child/navbar-procedure-guide/navbar-procedure-guide.component';
import { PagesGuideProcedureComponent } from './pages/pages-guide-procedure/pages-guide-procedure.component';
import { PagesInformationComponent } from './pages/pages-information/pages-information.component';
import { AcademicCoordintationGuideComponent } from './pages/pages-guide-procedure/academic-coordintation-guide/academic-coordintation-guide.component';
import { AcademicMonitoringGuideComponent } from './pages/pages-guide-procedure/academic-monitoring-guide/academic-monitoring-guide.component';
import { AcademicProcedureGuideComponent } from './pages/pages-guide-procedure/academic-procedure-guide/academic-procedure-guide.component';
import { PagesAppsComponent } from './pages/pages-apps/pages-apps.component';
import { PagesGaiaComponent } from './pages/pages-gaia/pages-gaia.component';
import { PagesContactsComponent } from './pages/pages-contacts/pages-contacts.component';
import { HeroProfileComponent } from './components/hero-profile/hero-profile.component';
import { MessageService } from 'primeng/api';
import { SectionContainerComponent } from './pages/section-container/section-container.component';
import { FormSectionComponent } from './components/navbar/form-section/form-section.component';
import { FormNavItemComponent } from './components/navbar/form-menu/form-menu.component';
import { DialogModule } from 'primeng/dialog';
import { PageContainerComponent } from './pages/page-container/page-container.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { CarouselModule } from 'primeng/carousel';
import { UserProfileModule } from './user-profile/user-profile.module';
import { InstitutionModule } from './institution/institution.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    HomeComponent,
    NavbarComponent,
    PagesComponent,
    EditInfoComponent,
    NavbarInformationComponent,
    NavbarProcedureGuideComponent,
    PagesGuideProcedureComponent,
    PagesInformationComponent,
    AcademicCoordintationGuideComponent,
    AcademicMonitoringGuideComponent,
    AcademicProcedureGuideComponent,
    PagesAppsComponent,
    PagesGaiaComponent,
    PagesContactsComponent,
    HeroProfileComponent,
    SectionContainerComponent,
    FormSectionComponent,
    FormNavItemComponent,
    PageContainerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AuthenticationModule,
    CommonModule,
    PostsModule,
    HttpClientModule,
    FontAwesomeModule,
    NgbModule,
    PdfViewerModule,
    CommentsModule,
    BrowserAnimationsModule,
    EditorModule,
    FormsModule,
    InputTextModule,
    ToastModule,
    ReactiveFormsModule,
    DialogModule,
    InputNumberModule,
    CarouselModule,
],
  exports: [
    NavbarComponent
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    {
      provide: APP_INITIALIZER,
      useFactory: refreshTokenFactory,
      deps: [AuthService],
      multi: true
    },
    [MessageService]
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faUser); // Agrega el icono faUser a la librería
  }
}
