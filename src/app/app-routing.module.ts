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
import { PresentationComponent } from './pages/pages-information/presentation/presentation.component';
import { AcademicCoordinationComponent } from './pages/pages-information/academic-coordination/academic-coordination.component';
import { CurriculumDevelopmentComponent } from './pages/pages-information/curriculum-development/curriculum-development.component';
import { AcademicPersonnelComponent } from './pages/pages-information/academic-personnel/academic-personnel.component';
import { AlternativeGraduationComponent } from './pages/pages-information/alternative-graduation/alternative-graduation.component';
import { AcademicMonitoringComponent } from './pages/pages-information/academic-monitoring/academic-monitoring.component';
import { RecordRegistrationComponent } from './pages/pages-information/record-registration/record-registration.component';
import { PagesGuideProcedureComponent } from './pages/pages-guide-procedure/pages-guide-procedure.component';
import { AcademicMonitoringGuideComponent } from './pages/pages-guide-procedure/academic-monitoring-guide/academic-monitoring-guide.component';
import { PagesInformationComponent } from './pages/pages-information/pages-information.component';
import { AcademicProcedureGuideComponent } from './pages/pages-guide-procedure/academic-procedure-guide/academic-procedure-guide.component';
import { PagesGaiaComponent } from './pages/pages-gaia/pages-gaia.component';
import { PagesContactsComponent } from './pages/pages-contacts/pages-contacts.component';
import { PageComponent } from './posts/components/post-page/page/page.component';

const routes: Routes = [
  {
    path: '', component: HomeComponent, 
    children: [
      { path: '', redirectTo: '/posts', pathMatch: 'full'},
      {
        path: 'posts',
        component: ViewAllPostsComponent,
      },
      { path: 'informacion',
        component: PagesInformationComponent,
        children: [
          { path: '', redirectTo: 'presentacion', pathMatch: 'full' },
          { path: 'presentacion', component: PresentationComponent },
          { path: 'coordinacion-academica', component: AcademicCoordinationComponent },
          { path: 'desarrollo-curricular', component: CurriculumDevelopmentComponent },
          { path: 'personal-academico', component: AcademicPersonnelComponent },
          { path: 'titulacion-alternativa', component: AlternativeGraduationComponent },
          { path: 'seguimiento-academico', component: AcademicMonitoringComponent },
          { path: 'registro-inscripciones', component: RecordRegistrationComponent },
          { path: '**', redirectTo: 'presentacion', pathMatch: 'full' }
        ]
      },
      { path: 'gaia',
        component: PagesGaiaComponent
      },
      { path: 'guia-seguimiento-tramites',
        component: PagesGuideProcedureComponent,
        children: [
          { path: '', redirectTo: 'guia-tramites', pathMatch: 'full' },
          { path: 'guia-tramites', component: AcademicProcedureGuideComponent },
          { path: 'seguimiento-tramites', component: AcademicMonitoringGuideComponent },
          { path: '**', redirectTo: 'guia-tramites', pathMatch: 'full' }
        ]
      },
      { path: 'contactos',
        component: PagesContactsComponent
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
