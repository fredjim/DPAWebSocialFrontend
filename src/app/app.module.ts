import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'

import { HttpClientModule } from '@angular/common/http';
import { AuthService } from './authentication/services/auth.service';
export function refreshTokenFactory(authService: AuthService) {
  return () => authService.tryRefreshOnStartup();
}
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthenticationModule } from './authentication/authentication.module';
import { PostsModule } from './posts/posts.module';
import { CommonModule } from '@angular/common';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { InteractionsModule } from "./interactions/interactions.module";
import { MessageService } from 'primeng/api';
import { UserProfileModule } from './user-profile/user-profile.module';
import { InstitutionModule } from './institution/institution.module';
import { CoreModule } from './core/core.module';
import { LayoutModule } from './layout/layout.module';
import { SharedModule } from './shared/shared.module';

@NgModule({
  declarations: [AppComponent],
  imports: [
    AppRoutingModule,
    AuthenticationModule,
    BrowserAnimationsModule,
    BrowserModule,
    InteractionsModule,
    CommonModule,
    CoreModule,
    HttpClientModule,
    InstitutionModule,
    LayoutModule,
    PostsModule,
    SharedModule,
    UserProfileModule,
  ],
  providers: [
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
