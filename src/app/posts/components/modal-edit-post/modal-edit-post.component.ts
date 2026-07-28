import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { Subject, takeUntil, concatMap, Observable, of, forkJoin } from 'rxjs';
import { Institution } from '../../../shared/models/institution';
import { Post } from '../../models/post';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { UserStateService } from '../../../core/services/user-state.service';
import { Media } from '../../../shared/models/media';
import { CreatePost } from '../../models/create-post';
import { UploadedMedia } from '../../../shared/models/uploaded-media';
import { Modal } from 'bootstrap';
import { UserDetail } from '../../../shared/models/user-detail';
import { ImageOptimizationService } from '../../../shared/services/image-optimization.service';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-modal-edit-post',
  templateUrl: './modal-edit-post.component.html',
  styleUrl: './modal-edit-post.component.scss'
})
export class ModalEditPostComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  @Input({ required: true }) institution!: Institution;
  @Input({ required: true }) postToEdit!: Post;
  @Input() showModalEdit!: WritableSignal<boolean>;
  @Output() postUpdatedEvent = new EventEmitter<Post>();
  public isLoading = false;
  public commentsEnabled: boolean = true;
  public maxLegthTextPost = 1200;
  public visibleAreaMedia = signal(false); //Mostrar seleccion y prevista de imagenes
  public visibleAreaDocs = signal(false); //Mostrar seleccion y prevista de documentos

  public disabledSaveButton = signal(true); //Deshabilitar el boton de guardar
  public postForm!: FormGroup;
  public listImagesVideosPost: Media[] = [];  //Lista para enviar a 'image-video-editor' component
  public listDocsPost: Media[] = [];        //Lista para enviar a 'document-editor' component
  private listNewMediaFile: File[] = []; //Lista de media editada obtenida de 'image-video-editor' component
  private listNewDocFile: File[] = []; //Docs añadidos en edicion
  private listContentMediaPost!: Media[]; //Lista de media (imgs vids docs) que existe en el post
  private currentUser!: UserDetail;
  private readonly currentPostType: string = 'GENERAL';

  constructor(
      private readonly postService: PostService,
      private readonly userStateService: UserStateService,
      private readonly formBuilder: FormBuilder,
      private readonly imageOptimizationService: ImageOptimizationService
  ){}

  ngOnInit(){
    this.commentsEnabled = this.postToEdit.commentsEnabled ?? true;
    this.getUser();
    this.buildForm();
    
    // Inicializar listContentMediaPost con los medios existentes del post
    this.listContentMediaPost = this.postToEdit.content.media;
    for (const media of this.postToEdit.content.media) {
      media.type === 'document' ? 
        this.listDocsPost.push(media) : 
        this.listImagesVideosPost.push(media)
    }
  }

  private buildForm() {
    this.postForm = this.formBuilder.group({
      contentPost: [this.postToEdit.content.text, [Validators.maxLength(this.maxLegthTextPost)]],
      media: [[]],
      mediaDoc: [[]]
    });
  }

  //Obtener texto editado del textarea y Deshabilitar el boton de guardar si no hay texto
  getTextPost(text: string){
    this.postForm.get('contentPost')?.setValue(text);
    this.checkDisableSaveButton();
  }
  
  //Mostrar area de imagenes y deshabilitar el boton de cargar documentos
  showAreaMedia(){
    this.visibleAreaMedia.set(true);
  }
  
  //Ocultar area de imagenes
  closeAreaMedia(){
    //Deshabilitar el boton de guardar si no hay info
    this.checkDisableSaveButton();
  }
  
  //Establecer NUEVAS imagenes-videos editados y verificar deshabilitar boton Guardar
  setFilesMediaPostAdded(fileMedia: File[]){
    this.listNewMediaFile = fileMedia;
    this.checkDisableSaveButton();
  }

  //Establecer VIEJAS imagenes-videos ya existentes y verificar deshabilitar boton Guardar
  setFilesMediaPostOld(oldMediaRemoved: Media[]){
    this.listContentMediaPost = this.listContentMediaPost.filter(
      media => !oldMediaRemoved.some(removed => removed.uuid === media.uuid)
    );
    this.checkDisableSaveButton();
  }

  //Establecer los Docs preexistentes
  setFileDocPostOld(oldDocsRemoved: Media[]){
    this.listContentMediaPost = this.listContentMediaPost.filter(
      doc => !oldDocsRemoved.some(removed => removed.uuid === doc.uuid)
    );
    this.checkDisableSaveButton();
  }
  
  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc(){
    this.visibleAreaDocs.set(true);
  }
  
  //Ocultar area de documentos
  closeAreaDoc(){
    // Limpiar si selecciono un File para Doc y la lista de docs se 
    this.listNewDocFile = [];//Limpiar los nuevos docs
    this.checkDisableSaveButton();
  }
  
  //Establecer los Nuevos Docs y verificar deshabilitar boton Guardar
  setFileDocPostAdded(docs: File[]){
    this.listNewDocFile = docs;
    this.checkDisableSaveButton();
  }

  private checkDisableSaveButton(){
    const textPost: string = this.postForm.get('contentPost')?.value ?? '';
    const commentsEnabledChanged = this.commentsEnabled !== (this.postToEdit.commentsEnabled ?? true);
    if((textPost === '' || textPost.length > this.maxLegthTextPost) && (this.listNewMediaFile.length === 0
      && this.listContentMediaPost.length === 0 && this.listNewDocFile.length === 0) && !commentsEnabledChanged){
      this.disabledSaveButton.set(true);
    }else{
      this.disabledSaveButton.set(false);
    }
  }

  public onCommentsEnabledChange(): void {
    this.checkDisableSaveButton();
  }

  //Cerrar modal sin guardar cambios
  closeResetModalEdit(id: string){
    const modalElement = document.getElementById('edit-'+id);
    if (modalElement) {
      let modal = Modal.getInstance(modalElement);
      modal?.hide();
      this.commentsEnabled = this.postToEdit.commentsEnabled ?? true;
      this.showModalEdit.set(false);
      this.listNewMediaFile = [];
      this.listNewDocFile = [];
      this.listContentMediaPost = this.postToEdit.content.media;
      this.postForm.get('contentPost')?.setValue(this.postToEdit.content.text);
      this.disabledSaveButton.set(true);
    }
  }

  //Abrir modal de confirmación de salir de edición
  openModalConfirmExitEdit(id: string){
    const modalElement = document.getElementById('confirmExitEditPost-'+id);
    if (modalElement) {
      modalElement.style.zIndex = "1070";
      const modal = new Modal(modalElement);
      modal.show();
      setTimeout(() => {
        let backdrops = document.getElementsByClassName("modal-backdrop") as HTMLCollectionOf<HTMLElement>;
        if (backdrops.length > 1) {
          backdrops[backdrops.length - 1].style.zIndex = "1060"; // Último backdrop
        }
      }, 10);
    }
  }

  getUser() {
    this.userStateService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next:(user) => {
          if(!user) return;
          this.currentUser = user;
        },
        error:(error) => {
          console.error('Error al obtener el usuario actual', error);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  async updatePost() {
    this.isLoading = true;
    const valueFormPost = this.postForm.value;

    const editedPost: CreatePost = {
      date: this.postToEdit.date,
      commentsEnabled: this.commentsEnabled,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost,
        media: []
      },
      fb_post_enable: false
    };

    const hasNewMedia = this.listNewMediaFile && this.listNewMediaFile.length > 0;
    const hasNewDocs = this.listNewDocFile && this.listNewDocFile.length > 0;
    const hasContent = valueFormPost.contentPost != '' || this.listContentMediaPost.length > 0;

    // Si no hay ni texto, ni media existente, ni nuevos archivos, no hacemos nada
    if (!hasContent && !hasNewMedia && !hasNewDocs) {
      this.isLoading = false;
      return;
    }

    const amountExistingMedia = this.listContentMediaPost.length;

    // Upload de nuevas imágenes/videos (con optimización previa), si corresponde
    let mediaUpload$: Observable<UploadedMedia[]> = of([]);
    if (hasNewMedia) {
      let filesToUpload: File[] = this.listNewMediaFile;
      try {
        filesToUpload = await this.imageOptimizationService.optimizeImages(this.listNewMediaFile);
      } catch (error) {
        console.warn('Error en optimización, usando archivos originales:', error);
      }

      const formDataMedia = new FormData();
      Array.from(filesToUpload).forEach((file: File) => {
        file.type.includes('image')
          ? formDataMedia.append('images', file)
          : formDataMedia.append('videos', file);
      });

      mediaUpload$ = this.postService.uploadMedia(formDataMedia);
    }

    // Upload de nuevos documentos, si corresponde
    let docsUpload$: Observable<UploadedMedia[]> = of([]);
    if (hasNewDocs) {
      const formDataDocs = new FormData();
      Array.from(this.listNewDocFile).forEach((file: File) => {
        formDataDocs.append('files', file);
      });

      docsUpload$ = this.postService.uploadDocument(formDataDocs);
    }

    // Ambos uploads en paralelo (los que no aplican resuelven de inmediato con [])
    forkJoin([mediaUpload$, docsUpload$]).pipe(
      concatMap(([mediaResults, docResults]) => {
        const newMediaItems = mediaResults.map((media, index) => ({
          number: amountExistingMedia + index + 1,
          type: media.mimeType.includes('image') ? 'image' : 'video',
          file_name: media.name,
          uploaded_file_uuid: media.uuid
        }));

        const newDocItems = docResults.map((media, index) => ({
          number: amountExistingMedia + newMediaItems.length + index + 1,
          type: 'document',
          file_name: media.name,
          uploaded_file_uuid: media.uuid
        }));

        // listContentMediaPost ya contiene solo los medios existentes que NO fueron eliminados
        editedPost.content.media = [...this.listContentMediaPost, ...newMediaItems, ...newDocItems];

        return this.postService.updatePost(this.postToEdit.uuid, editedPost);
      })
    ).subscribe({
      next: (updatedPost) => this.updateSuccessPost(updatedPost),
      error: (error: HttpErrorResponse) => this.updateErrorPost('Error al actualizar la publicación', error)
    });
  }

  private updateSuccessPost(editedPost: Post): void {
    this.isLoading = false;
    this.postUpdatedEvent.emit(editedPost);
    this.closeResetModalEdit(editedPost.uuid);
    this.toastRef.showSuccess('Publicación actualizada exitosamente', 'Éxito');
  }

  private updateErrorPost(errorMsg: string, error: HttpErrorResponse): void {
    this.isLoading = false;
    this.toastRef.showError(errorMsg, 'Error');
    console.log(errorMsg, error)
  }
}
