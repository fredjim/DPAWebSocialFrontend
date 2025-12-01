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
import { PageComponent } from './posts/components/post-page/page/page.component';
import { SectionContainerComponent } from './pages/section-container/section-container.component';
import { PageContainerComponent } from './pages/page-container/page-container.component';
import { SectionResolver } from './resolvers/section.resolver';

const routes: Routes = [
  {
    path: '', component: HomeComponent, 
    children: [
      { path: '', redirectTo: '/posts', pathMatch: 'full'},
      {
        path: 'posts',
        component: ViewAllPostsComponent,
      },
      { path: 'fotos', 
        component: PhotosGalleryComponent
      },
      { path: 'videos', 
        component: VideosGalleryComponent
      },
      { path: 'convenios', 
        component: ViewAllPostsConveniosComponent
      },
      { path: 'proyectos', 
        component: ViewAllPostsProyectosComponent
      },
      { path: 'becas', 
        component: ViewAllPostsBecasComponent
      },
      { path: 'cudie', 
        component: ViewAllPostsCudieComponent
      },
      { 
        path: ':uuidNavItem',
        component: PageContainerComponent,
        children: [
          { 
            path: ':uuidSection', 
            component: SectionContainerComponent,
            resolve: {
              section: SectionResolver
            }
          }
        ]
      }
    ],
  },
  {
    path: 'posts/:id',
    component: PageComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
