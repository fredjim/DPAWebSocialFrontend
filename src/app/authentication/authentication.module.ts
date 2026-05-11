import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthGuardService } from './services/auth-guard.service';
import { AuthService } from './services/auth.service';
import { UserDatastoreService } from './services/user-datastore.service';
import { UserService } from './services/user.service';
import { JwtDecodeService } from './services/jwt-decode.service';
import { ChangePasswordComponent } from './components/change-password/change-password.component';
import { HttpClientModule } from '@angular/common/http';
import { LoginComponent } from './components/login/login.component';
import { CreateAccountComponent } from './components/create-account/create-account.component';
import { RegisterComponent } from './components/register/register.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RippleModule } from 'primeng/ripple';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    LoginComponent,
    ChangePasswordComponent,
    CreateAccountComponent,
    RegisterComponent,
    VerifyEmailComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    ReactiveFormsModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    DialogModule,
    CardModule,
    ProgressSpinnerModule,
    RippleModule,
    SharedModule
  ],
  exports: [
    LoginComponent,
    CreateAccountComponent,
    RegisterComponent,
    VerifyEmailComponent,
    ResetPasswordComponent
  ],
  providers: [
    AuthGuardService,
    AuthService,
    JwtDecodeService,
    UserDatastoreService,
    UserService
  ]
})
export class AuthenticationModule { }
