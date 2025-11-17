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
import { PagesGuideProcedureComponent } from './pages/pages-guide-procedure/pages-guide-procedure.component';
import { AcademicMonitoringGuideComponent } from './pages/pages-guide-procedure/academic-monitoring-guide/academic-monitoring-guide.component';
import { PagesInformationComponent } from './pages/pages-information/pages-information.component';
import { AcademicProcedureGuideComponent } from './pages/pages-guide-procedure/academic-procedure-guide/academic-procedure-guide.component';
import { PagesGaiaComponent } from './pages/pages-gaia/pages-gaia.component';
import { PagesContactsComponent } from './pages/pages-contacts/pages-contacts.component';
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
      { path: ':uuidNavItem',
        component: PageContainerComponent,
        children: [
          { 
            path: ':uuidSection', 
            component: SectionContainerComponent,
            resolve: {
              section: SectionResolver // precargar datos
            }
          }
        ]
      },
      // { path: 'informacion',
      //   component: PagesInformationComponent,
      //   children: [
      //     { path: '', redirectTo: '919ab4e8-0856-4aad-b3aa-747e2dba76d9', pathMatch: 'full' },
      //     { 
      //       path: ':uuid', 
      //       component: SectionContainerComponent,
      //       // resolve: {
      //       //   section: SectionResolver // Opcional: para precargar datos
      //       // }
      //     },
      //     { path: '**', redirectTo: '919ab4e8-0856-4aad-b3aa-747e2dba76d9', pathMatch: 'full' }
      //   ]
      // },
      // { path: 'gaia',
      //   component: PagesGaiaComponent
      // },
      // { path: 'guia-seguimiento-tramites',
      //   component: PagesGuideProcedureComponent,
      //   children: [
      //     { path: '', redirectTo: 'guia-tramites', pathMatch: 'full' },
      //     { path: 'guia-tramites', component: AcademicProcedureGuideComponent },
      //     { path: 'seguimiento-tramites', component: AcademicMonitoringGuideComponent },
      //     { path: '**', redirectTo: 'guia-tramites', pathMatch: 'full' }
      //   ]
      // },
      // { path: 'contactos',
      //   component: PagesContactsComponent
      // },
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
