import { RouterModule, Routes } from "@angular/router";
import { NgModule } from "@angular/core";
import { PageContainerComponent } from "../layout/components/page-container/page-container.component";
import { ArticleContainerComponent } from "./components/article-container/article-container.component";
import { SectionResolver } from "./resolvers/section.resolver";


const routes: Routes = [
  {
    path: '',
    component: PageContainerComponent,
    children: [
      {
        path: ':pathSection',
        component: ArticleContainerComponent,
        resolve: { section: SectionResolver }
      }
    ]
  }
];


@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ArticlesRoutingModule {}