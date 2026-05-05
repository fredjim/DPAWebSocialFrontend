import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ViewAllPostsComponent } from './posts/components/view-all-posts/view-all-posts.component';
import { PhotosGalleryComponent } from './posts/components/photos-gallery/photos-gallery.component';
import { VideosGalleryComponent } from './posts/components/videos-gallery/videos-gallery.component';
import { ViewAllPostsConveniosComponent } from './posts/components/view-all-posts-convenios/view-all-posts-convenios.component';
import { ViewAllPostsProyectosComponent } from './posts/components/view-all-posts-proyectos/view-all-posts-proyectos.component';
import { ViewAllPostsBecasComponent } from './posts/components/view-all-posts-becas/view-all-posts-becas.component';
import { ViewAllPostsCudieComponent } from './posts/components/view-all-posts-cudie/view-all-posts-cudie.component';
import { SectionContainerComponent } from './pages/section-container/section-container.component';
import { PageContainerComponent } from './pages/page-container/page-container.component';
import { SectionResolver } from './resolvers/section.resolver';
import { ProfileComponent } from './user-profile/components/profile/profile.component';
import { ProfileInstitutionComponent } from './institution/components/profile-institution/profile-institution.component';
import { authGuard } from './authentication/services/auth.guard';
import { environment } from '../environments/environment';

const routes: Routes = [
  // Todas las rutas que requieren slug (públicas y protegidas)
  {
    path: ':slug',
    children: [
      // Rutas protegidas
      {
        path: 'profile',
        component: ProfileComponent,
        canActivate: [authGuard]
      },
      {
        path: 'institution',
        component: ProfileInstitutionComponent,
        canActivate: [authGuard],
        data: { roles: ['ADMIN'] }
      },
      
      // Rutas públicas con layout del tenant
      {
        path: '',
        component: HomeComponent,  // Este componente contiene header/footer del tenant
        children: [
          { path: '', redirectTo: 'posts', pathMatch: 'full' },
          { path: 'posts/:id', component: ViewAllPostsComponent },
          { path: 'posts', component: ViewAllPostsComponent },
          { path: 'fotos', component: PhotosGalleryComponent },
          { path: 'videos', component: VideosGalleryComponent },
          { path: 'convenios', component: ViewAllPostsConveniosComponent },
          { path: 'proyectos', component: ViewAllPostsProyectosComponent },
          { path: 'becas', component: ViewAllPostsBecasComponent },
          { path: 'cudie', component: ViewAllPostsCudieComponent },
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
