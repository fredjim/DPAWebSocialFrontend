import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.status = 'error';
      this.message = 'El link no contiene un token válido.';
      return;
    }
    this.authService.verifyEmail(token).subscribe({
      next: (res) => {
        this.status = 'success';
        this.message = res.message;
      },
      error: (err) => {
        this.status = 'error';
        this.message = err?.error?.message || 'Ha ocurrido un error al verificar tu email.';
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/']);
  }
}
