import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { AuthInterceptor } from './core/interceptors/auth-interceptor';
import { TenantInterceptor } from './core/interceptors/tenant-interceptor';
import { AuthService } from './authentication/services/auth.service';
export function refreshTokenFactory(authService: AuthService) {
  return () => authService.tryRefreshOnStartup();
}
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './authentication/authentication.module';
import { PostsModule } from './posts/posts.module';
import { CommonModule } from '@angular/common';
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
import { MessageService } from 'primeng/api';
import { SectionContainerComponent } from './pages/section-container/section-container.component';
import { DialogModule } from 'primeng/dialog';
import { PageContainerComponent } from './pages/page-container/page-container.component';
import { InputNumberModule } from 'primeng/inputnumber';
import { CarouselModule } from 'primeng/carousel';
import { UserProfileModule } from './user-profile/user-profile.module';
import { InstitutionModule } from './institution/institution.module';
import { SharedModule } from './shared/shared.module';
import { MenuModule } from 'primeng/menu';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';

@NgModule({
  declarations: [
    AppComponent,
    PagesComponent,
    EditInfoComponent,
    SectionContainerComponent,
    PageContainerComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AuthenticationModule,
    CommonModule,
    CoreModule,
    LayoutModule,
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
    SharedModule,
    MenuModule
],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TenantInterceptor,
      multi: true
    },
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
