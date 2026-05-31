import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ViewAllPostsComponent } from './posts/components/view-all-posts/view-all-posts.component';
import { MediaGalleryComponent } from './posts/components/media-gallery/media-gallery.component';
import { SectionContainerComponent } from './pages/section-container/section-container.component';
import { PageContainerComponent } from './pages/page-container/page-container.component';
import { SectionResolver } from './resolvers/section.resolver';
import { ProfileComponent } from './user-profile/components/profile/profile.component';
import { ProfileInstitutionComponent } from './institution/components/profile-institution/profile-institution.component';
import { VerifyEmailComponent } from './authentication/components/verify-email/verify-email.component';
import { ResetPasswordComponent } from './authentication/components/reset-password/reset-password.component';
import { authGuard } from './authentication/services/auth.guard';

const routes: Routes = [
  // Rutas standalone — llegan desde links de email, sin contexto de subdominio de tenant
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // ROOT dashboard — lazy loaded, tenant-agnostic (root.umss.net o /root)
  {
    path: 'root',
    loadChildren: () =>
      import('./root-dashboard/root-dashboard.module').then(m => m.RootDashboardModule)
  },

  // Rutas del tenant — el tenant se resuelve desde el subdominio, no desde el path
  {
    path: '',
    component: HomeComponent,
    children: [
      { path: '', redirectTo: 'posts', pathMatch: 'full' },

      // Rutas públicas
      { path: 'posts', component: ViewAllPostsComponent },
      { path: 'posts/:id', component: ViewAllPostsComponent },
      { path: 'fotos', component: MediaGalleryComponent,
        data: { hideHero: true, hideNavbar: true, showGoBack: true } },
      { path: 'videos', component: MediaGalleryComponent,
        data: { hideHero: true, hideNavbar: true, showGoBack: true } },
      { path: 'documentos', component: MediaGalleryComponent,
        data: { hideHero: true, hideNavbar: true, showGoBack: true } },

      // Rutas protegidas
      { path: 'profile', component: ProfileComponent,
        canActivate: [authGuard],
        data: { hideHero: true, hideNavbar: true, showGoBack: true } },
      { path: 'institution', component: ProfileInstitutionComponent,
        canActivate: [authGuard],
        data: { roles: ['ADMIN'], hideHero: true, hideNavbar: true, showGoBack: true } },

      // Secciones de navegación dinámica
      {
        path: ':pathNavItem',
        component: PageContainerComponent,
        children: [
          {
            path: ':pathSection',
            component: SectionContainerComponent,
            resolve: { section: SectionResolver }
          }
        ]
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
