import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewAllPostsComponent } from './components/view-all-posts/view-all-posts.component';
import { DepartmentDetailsComponent } from './components/department-details/department-details.component';
import { PostComponent } from './components/post/post.component';

import { CreatePostComponent } from './components/create-post/create-post.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TextEditorComponent } from './components/create-post/text-editor/text-editor.component';
import { ImagesUploaderComponent } from './components/create-post/images-videos-uploader/images-uploader.component';
import { DocumentUploaderComponent } from './components/create-post/document-uploader/document-uploader.component';

import { OptionsPostComponent } from './components/options-post/options-post.component';
import { ModalDeletePostComponent } from './components/modal-delete-post/modal-delete-post.component';
import { ModalEditPostComponent } from './components/modal-edit-post/modal-edit-post.component';
import { EditTextComponent } from './components/modal-edit-post/edit-text/edit-text.component';
import { ImageVideoEditorComponent } from './components/modal-edit-post/image-video-editor/image-video-editor.component';
import { ModalListReactionsComponent } from './components/modal-list-reactions/modal-list-reactions.component';
import { DocumentEditorComponent } from './components/modal-edit-post/document-editor/document-editor.component';
import { ViewPostDetailComponent } from './components/view-post-detail/view-post-detail.component';
import { MediaGalleryComponent } from './components/media-gallery/media-gallery.component';
import { HomePhotosSectionComponent} from './components/home-photos-section/home-photos-section.component';
import { InteractionsModule } from '../interactions/interactions.module';
import { NgbCarouselModule } from '@ng-bootstrap/ng-bootstrap';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { AppRoutingModule } from "../app-routing.module";
import { SharedModule } from '../shared/shared.module';
import { TabViewModule } from 'primeng/tabview';
import { CarouselModule } from 'primeng/carousel';
import { MessagesModule } from 'primeng/messages';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [
    ViewAllPostsComponent,
    DepartmentDetailsComponent,
    PostComponent,
    CreatePostComponent,
    TextEditorComponent,
    ImagesUploaderComponent,
    DocumentUploaderComponent,
    OptionsPostComponent,
    ModalDeletePostComponent,
    ModalEditPostComponent,
    EditTextComponent,
    ImageVideoEditorComponent,
    ModalListReactionsComponent,
    DocumentEditorComponent,
    ViewPostDetailComponent,
    MediaGalleryComponent,
    HomePhotosSectionComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    InteractionsModule,
    NgbCarouselModule,
    PdfViewerModule,
    OverlayPanelModule,
    AppRoutingModule,
    SharedModule,
    TabViewModule,
    CarouselModule,
    MessagesModule,
    PaginatorModule,
    TooltipModule
  ],
  exports: [
    ViewAllPostsComponent,
    PostComponent
  ]

})
export class PostsModule { }