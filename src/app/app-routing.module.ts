import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './layout/components/home/home.component';
import { ViewAllPostsComponent } from './posts/components/view-all-posts/view-all-posts.component';
import { VerifyEmailComponent } from './authentication/components/verify-email/verify-email.component';
import { ResetPasswordComponent } from './authentication/components/reset-password/reset-password.component';
import { environment } from '../environments/environment';
import { authGuard } from './authentication/services/auth.guard';

const routes: Routes = [
  // Rutas públicas standalone (sin slug — llegan desde links de email)
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

     // ROOT dashboard — lazy loaded, debe ir ANTES del wildcard :slug
  {
    path: 'root',
    loadChildren: () =>
      import('./root-dashboard/root-dashboard.module').then(m => m.RootDashboardModule)
  },
  
  // Todas las rutas que requieren slug (públicas y protegidas)
  {
    path: ':slug',
    component: HomeComponent,  // Este componente contiene header/footer del tenant
    children: [
      // Rutas protegidas
      {
        path: 'profile',
        canActivate: [authGuard],
        data: { hideHero: true, hideNavbar: true, showGoBack: true },
        loadChildren: () => import('./user-profile/user-profile.module').then(m => m.UserProfileModule)
      },
      {
        path: 'institution',
        canActivate: [authGuard],
        data: { roles: ['ADMIN'], hideHero: true, hideNavbar: true, showGoBack: true },
        loadChildren: () => import('./institution/institution.module').then(m => m.InstitutionModule)
      },
      
      // Rutas públicas
      { path: '', redirectTo: 'posts', pathMatch: 'full' },
      { path: 'posts/:id', component: ViewAllPostsComponent },
      { path: 'posts', component: ViewAllPostsComponent },
      // { path: 'fotos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
      // { path: 'videos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
      // { path: 'documentos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  } },
      {
        path: ':pathNavItem',
        loadChildren: () => import('./articles/articles.module').then(m => m.ArticlesModule)
      }
    ]
  },

  // Raíz → redirige al tenant por defecto
  {
    path: '',
    redirectTo: environment.DEFAULT_TENANT_SLUG,
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
