import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './layout/components/home/home.component';
import { ViewAllPostsComponent } from './posts/components/view-all-posts/view-all-posts.component';
import { VerifyEmailComponent } from './authentication/components/verify-email/verify-email.component';
import { ResetPasswordComponent } from './authentication/components/reset-password/reset-password.component';
import { authGuard } from './authentication/services/auth.guard';
import { tenantGuard } from './core/guards/tenant.guard';

const routes: Routes = [
  // Rutas standalone — llegan desde links de email, sin contexto de subdominio de tenant
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ROOT dashboard — lazy loaded, tenant-agnostic (root.umss.net o /root)
  // { path: 'not-found', component: NotFoundComponent },
  // ROOT dashboard — lazy loaded, debe ir ANTES del wildcard :slug
  {
    path: 'root',
    loadChildren: () =>
      import('./root-dashboard/root-dashboard.module').then(m => m.RootDashboardModule)
  },

  // Rutas del tenant — el tenant se resuelve desde el subdominio, no desde el path
  {
    path: '',
    component: HomeComponent,  // Este componente contiene header/footer del tenant
    canActivate: [tenantGuard],
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

      // Rutas públicas
      { path: 'posts', component: ViewAllPostsComponent },
      { path: 'posts/:id', component: ViewAllPostsComponent },

      // Secciones de navegación dinámica
      // { path: 'fotos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
      // { path: 'videos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
      // { path: 'documentos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  } },
      {
        path: ':pathNavItem',
        loadChildren: () => import('./articles/articles.module').then(m => m.ArticlesModule)
      },
      // { path: '**', component: NotFoundComponent } // ← sub-rutas inexistentes dentro de un slug válido
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
