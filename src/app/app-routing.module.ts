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
import { environment } from '../environments/environment';

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
    children: [
      // Rutas protegidas
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [authGuard],
        data: { showGoBack: true }
      },
      {
        path: 'institution',
        component: ProfileInstitutionComponent,
        canActivate: [authGuard],
        data: { roles: ['ADMIN'], showGoBack: true }
      },
      
      // Rutas públicas con layout del tenant
      {
        path: '',
        component: HomeComponent,  // Este componente contiene header/footer del tenant
        children: [
          { path: '', redirectTo: 'posts', pathMatch: 'full' },
          { path: 'posts/:id', component: ViewAllPostsComponent },
          { path: 'posts', component: ViewAllPostsComponent },
          { path: 'fotos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
          { path: 'videos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  }  },
          { path: 'documentos', component: MediaGalleryComponent, data: { hideHero: true, hideNavbar: true, showGoBack: true  } },
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
