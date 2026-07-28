import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { Subject, takeUntil, concatMap } from 'rxjs';
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
  
  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc(){
    this.visibleAreaDocs.set(true);
  }
  
  //Ocultar area de documentos
  closeAreaDoc(){
    // Limpiar si selecciono un File para Doc y la lista de Medias si habia un Doc 
    this.listNewDocFile = [];//Limpiar el archivo
    this.listContentMediaPost = [];
    this.checkDisableSaveButton();
  }
  
  //Establecer los Docs editados y verificar deshabilitar boton Guardar
  setFileDocPostAdded(docs: File[]){
    this.listNewDocFile = docs;
    this.checkDisableSaveButton();
  }

  //Establecer los Docs preexistentes
  setFileDocPostOld(oldDocsRemoved: Media[]){
    this.listContentMediaPost = this.listContentMediaPost.filter(
      doc => !oldDocsRemoved.some(removed => removed.uuid === doc.uuid)
    );
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
  
  async updatePost(){
    this.isLoading = true;
    const valueFormPost = this.postForm.value;
    const formData = new FormData();
    const responseMedia: Media[] = []; //Respuesta de imagenes y videos guardados
    const editedPost: CreatePost = {
      date: this.postToEdit.date,
      commentsEnabled: this.commentsEnabled,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost,
        media: []
      },
      fb_post_enable: false
    }

    //Si hay info para postear (texto, imagen o video, documento)
    if(valueFormPost.contentPost != '' || this.listContentMediaPost.length > 0 || this.listNewMediaFile.length > 0 || this.listNewDocFile.length > 0){

      //Si hay nuevas imagenes-videos se los procesa Y imgs-videos eliminados se actualiza
      if(this.listNewMediaFile && this.listNewMediaFile.length > 0){ 

        try {
          // 1. Optimizar nuevas imágenes
          const optimizedFiles = await this.imageOptimizationService.optimizeImages(this.listNewMediaFile);
          
          // 2. Crear FormData con archivos optimizados
          Array.from(optimizedFiles).forEach((file) => {
            file.type.includes('image') ? formData.append('images', file) : formData.append('videos', file);
          });
        } catch (error) {
          console.warn('Error en optimización, usando archivos originales:', error);
          // Fallback a archivos originales
          Array.from(this.listNewMediaFile).forEach((file) => {
            file.type.includes('image') ? formData.append('images', file) : formData.append('videos', file);
          });
        }

        const amountImagesPost = this.postToEdit.content.media.length;

        //Subir las nuevas imagenes-videos
        this.postService.uploadMedia(formData).pipe(
          concatMap((uploadResponse: UploadedMedia[]) => {
            uploadResponse.forEach((media, index) => {

              responseMedia.push({
                number: index + 1 + amountImagesPost,
                type: media.mimeType.includes('image') ? 'image' : 'video',
                file_name: media.name,
                uploaded_file_uuid: media.uuid
              });
            });

            //Asignar las imgs/videos que ya habian en el post
            // Puede tener medias [{},{}] o ser un array vacio []
            editedPost.content.media = this.listContentMediaPost;

            //Añadir las nuevas medias que se agregaron
            Array.from(responseMedia).forEach((newMedia) => {
              editedPost.content.media.push(newMedia);
            });

            //Actualizar el post
            return this.postService.updatePost(this.postToEdit.uuid, editedPost);
          })
        ).subscribe({
          next: (updatedPost)=> this.updateSuccessPost(updatedPost),
          error: (error: HttpErrorResponse) => this.updateErrorPost('Error al actualizar publicación con contenido media', error)
        })
      }else if(this.listNewDocFile && this.listNewDocFile.length > 0){//Si hay nuevos archivos
        //Convertir el archivo en form data
        Array.from(this.listNewDocFile).forEach((file) => {
          formData.append('files', file);
        });

        const amountMediaPost = this.postToEdit.content.media?.length || 0;

        this.postService.uploadDocument(formData).pipe(
          concatMap((uploadResponse: UploadedMedia[]) => {
  
            uploadResponse.forEach((media, index) => {
              responseMedia.push({
                number: index + 1 + amountMediaPost,
                type: 'document',
                file_name: media.name,
                uploaded_file_uuid: media.uuid
              });
            });

            editedPost.content.media = [...this.listContentMediaPost];

            Array.from(responseMedia).forEach((newDoc) => {
              editedPost.content.media.push(newDoc);
            });

            editedPost.fb_post_enable = false;
            return this.postService.updatePost(this.postToEdit.uuid, editedPost);
          })
        ).subscribe({
          next: (updatedPost)=> this.updateSuccessPost(updatedPost),
          error: (error: HttpErrorResponse) => this.updateErrorPost('Error al actualizar publicación con archivo', error)
        })      
      }else if(valueFormPost.contentPost != '' || this.listContentMediaPost.length > 0 || this.listContentMediaPost.length === 0){//Si solo tiene texto O si se eliminaron medios
        // Usar directamente listContentMediaPost que ya contiene solo los medios que NO fueron eliminados
        // O si fueron eliminados listContentMediaPost es un []
        editedPost.content.media = [...this.listContentMediaPost];

        this.postService.updatePost(this.postToEdit.uuid, editedPost).subscribe({
          next: (updatedPost) => this.updateSuccessPost(updatedPost),
          error: (error: HttpErrorResponse) => this.updateErrorPost('Error al actualizar publicación', error)
        })
      }
    }
  }

  private updateSuccessPost(editedPost: Post): void {
    this.isLoading = false;
    this.postUpdatedEvent.emit(editedPost);
    this.toastRef.showSuccess('Publicación actualizada exitosamente', 'Éxito');
  }

  private updateErrorPost(errorMsg: string, error: HttpErrorResponse): void {
    this.isLoading = false;
    this.toastRef.showError(errorMsg, 'Error');
    console.log(errorMsg, error)
  }
}
