import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss'
})
export class CreateAccountComponent implements OnInit {
  public loginForm!: FormGroup;
  public hide = true;
  public inputType: string = 'password';
  public errorMessage!: string;
  @ViewChild('userFocus', { static: true })
  usernameField!: ElementRef;
  correctCredentials: boolean = true;
  public isLoggedIn = false;
  private currentSlug = '';

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly tenantService: TenantService
  ) { }

  ngOnInit(): void {
    this.currentSlug = this.tenantService.getSlug();
    this.buildForm();
  }

  private buildForm() {
    this.loginForm = this.formBuilder.group({
      username: ['202004185@est.umss.edu', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['Control123', [Validators.required, Validators.maxLength(100)]]
    });
  }

  login() {
    this.loginForm.markAllAsTouched();
    let dataValid = this.loginForm.valid
    if(dataValid){
      let login = this.loginForm.value;

      this.auth.login(login.username, login.password).subscribe(
        () => {
          this.isLoggedIn = true;
          this.router.navigate([`/${this.currentSlug}`]);
          globalThis.location.reload()
        },
        (error: any) => {
          console.log(error)
          this.correctCredentials = false;
        }
      );
    }

  }

  hasErrors(controlName:string, errorType: string){
    return this.loginForm.get(controlName)?.hasError(errorType) && this.loginForm.get(controlName)?.touched;
  }

  togglePasswordVisibility() {
    this.hide = !this.hide;
    this.inputType = this.inputType === 'password' ? 'text' : 'password';
  }

  loginReset(){
    this.loginForm.reset()
    this.correctCredentials = true
  }
}
