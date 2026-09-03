import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleFormComponent } from './components/article-form/article-form.component';
import { ArticleContainerComponent } from './components/article-container/article-container.component';
import { SharedModule } from '../shared/shared.module';
import { CarouselModule } from 'primeng/carousel';
import { ReactiveFormsModule } from '@angular/forms';
import { ArticlesRoutingModule } from './articles-routing.module';
import { DialogModule } from 'primeng/dialog';
import { EditorModule } from 'primeng/editor';
import { InputTextModule } from 'primeng/inputtext';

@NgModule({
  declarations: [
    ArticleFormComponent,
    ArticleContainerComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    CarouselModule,
    ReactiveFormsModule,
    ArticlesRoutingModule,
    DialogModule,
    EditorModule,
    InputTextModule
  ],
  exports: [
    ArticleContainerComponent
  ]
})
export class ArticlesModule { }
