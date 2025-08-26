import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './authentication/http-interceptors/auth-interceptor';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { HomeComponent } from './components/home/home.component';
import { AuthenticationModule } from './authentication/authentication.module';
import { PostsModule } from './posts/posts.module';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PagesComponent } from './pages/pages.component';
import { CommentsModule } from "./comments/comments.module";
import { EditorModule } from 'primeng/editor';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { EditInfoComponent } from './pages/edit-info/edit-info.component';
import { ToastModule } from 'primeng/toast';
import { NavbarInformationComponent } from './components/navbar/child/navbar-information/navbar-information.component';
import { NavbarProcedureGuideComponent } from './components/navbar/child/navbar-procedure-guide/navbar-procedure-guide.component';
import { PresentationComponent } from './pages/pages-information/presentation/presentation.component';
import { AcademicCoordinationComponent } from './pages/pages-information/academic-coordination/academic-coordination.component';
import { CurriculumDevelopmentComponent } from './pages/pages-information/curriculum-development/curriculum-development.component';
import { AcademicPersonnelComponent } from './pages/pages-information/academic-personnel/academic-personnel.component';
import { AlternativeGraduationComponent } from './pages/pages-information/alternative-graduation/alternative-graduation.component';
import { AcademicMonitoringComponent } from './pages/pages-information/academic-monitoring/academic-monitoring.component';
import { RecordRegistrationComponent } from './pages/pages-information/record-registration/record-registration.component';
import { PagesGuideProcedureComponent } from './pages/pages-guide-procedure/pages-guide-procedure.component';
import { PagesInformationComponent } from './pages/pages-information/pages-information.component';
import { AcademicCoordintationGuideComponent } from './pages/pages-guide-procedure/academic-coordintation-guide/academic-coordintation-guide.component';
import { AcademicMonitoringGuideComponent } from './pages/pages-guide-procedure/academic-monitoring-guide/academic-monitoring-guide.component';
import { PagesLinksComponent } from './pages/pages-links/pages-links.component';
import { NavbarLinksComponent } from './components/navbar/child/navbar-links/navbar-links.component';
import { LinksComponent } from './pages/pages-links/links/links.component';

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
    PresentationComponent,
    AcademicCoordinationComponent,
    CurriculumDevelopmentComponent,
    AcademicPersonnelComponent,
    AlternativeGraduationComponent,
    AcademicMonitoringComponent,
    RecordRegistrationComponent,
    PagesGuideProcedureComponent,
    PagesInformationComponent,
    AcademicCoordintationGuideComponent,
    AcademicMonitoringGuideComponent,
    PagesLinksComponent,
    NavbarLinksComponent,
    LinksComponent
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
    ToastModule
],
  providers: [
    // {
    //   provide: HTTP_INTERCEPTORS,
    //   useClass: AuthInterceptor,
    //   multi: true
    // }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor(library: FaIconLibrary) {
    library.addIcons(faUser); // Agrega el icono faUser a la librería
  }
}
