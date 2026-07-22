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
import { AuthService } from '../../../authentication/services/auth.service';
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
  public visibleAreaMediaDoc = signal(false); //Mostrar seleccion y prevista de documentos

  public disableLoadImage = signal(false); //Deshabilitar el boton de cargar imagenes
  public disableLoadDoc = signal(false); //Deshabilitar el boton de cargar documentos

  public disabledSaveButton = signal(true); //Deshabilitar el boton de guardar
  public postForm!: FormGroup;
  private listNewMediaFile: File[] = []; //Lista de media editada obtenida de 'image-video-editor' component
  private listOldMediaFile!: Media[]; //Lista de media editada que existe en el post
  private listNewDocFile: File[] = []; //Docs añadidos en edicion
  private currentUser!: UserDetail;
  private readonly currentPostType: string = 'GENERAL';
  public typeMedia = {
    img_vid : 'images-videos',
    doc: 'document'
  }

  constructor(
      private readonly postService: PostService,
      private readonly userStateService: UserStateService,
      private readonly formBuilder: FormBuilder,
      private readonly authService: AuthService,
      private readonly imageOptimizationService: ImageOptimizationService
  ){}

  ngOnInit(){
    if(this.postToEdit.content.media.length > 0) { 
      this.postToEdit.content.media[0].type === 'document' ?
        this.disableLoadImage.set(true) :
        this.disableLoadDoc.set(true)
    }
    this.commentsEnabled = this.postToEdit.commentsEnabled ?? true;
    this.getUser()
    this.buildForm()
    
    // Inicializar listOldMediaFile con los medios existentes del post
    this.listOldMediaFile = [...this.postToEdit.content.media];
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
    this.disableLoadDoc.set(true);
  }
  
  //Ocultar area de imagenes
  closeAreaMedia(option: boolean){
    this.disableLoadDoc.set(option); //Habilitar el boton de cargar documentos
    //Deshabilitar el boton de guardar si no hay info
    this.checkDisableSaveButton();
  }
  
  //Establecer NUEVAS imagenes-videos editados y verificar deshabilitar boton Guardar
  setFilesMediaPostAdded(fileMedia: File[]){
    this.listNewMediaFile = fileMedia;
    this.checkDisableSaveButton();
  }

  //Establecer VIEJAS imagenes-videos ya existentes y verificar deshabilitar boton Guardar
  setFilesMediaPostOld(fileMedia: Media[]){
    // Asignar fileMedia o un array vacío si es undefined
    this.listOldMediaFile = fileMedia;
    this.checkDisableSaveButton();
  }
  
  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc(){
    this.visibleAreaMediaDoc.set(true);
    this.disableLoadImage.set(true);
  }
  
  //Ocultar area de documentos
  closeAreaDoc(option: boolean){
    this.disableLoadImage.set(option);
    // Limpiar si selecciono un File para Doc y la lista de Medias si habia un Doc 
    this.listNewDocFile = [];//Limpiar el archivo
    this.listOldMediaFile = [];
    this.checkDisableSaveButton();
  }
  
  //Establecer los Docs editados y verificar deshabilitar boton Guardar
  setFileDocPostAdded(docs: File[]){
    this.listNewDocFile = docs;
    this.checkDisableSaveButton();
  }

  //Establecer los Docs preexistentes
  setFileDocPostOld(oldDocs: Media[]){
    this.listOldMediaFile = oldDocs;
    this.checkDisableSaveButton();
  }

  sendMedia(type: string){
    // Verificar si el post tiene contenido media
    if (!this.postToEdit.content.media || this.postToEdit.content.media.length === 0) {
      return []; // Retornar un array vacío si no hay media
    }
    
    if(type == this.typeMedia.img_vid){
      if(this.postToEdit.content.media.length > 0 && this.postToEdit.content.media[0].type != 'document')
        return this.postToEdit.content.media;
      else
        return []; // Retornar un array vacío en lugar de undefined
    }else{
      if(this.postToEdit.content.media.length > 0 && this.postToEdit.content.media[0].type == 'document')
        return this.postToEdit.content.media;
      else
        return []; // Retornar un array vacío en lugar de undefined
    }
  }

  private checkDisableSaveButton(){
    const textPost: string = this.postForm.get('contentPost')?.value ?? '';
    const commentsEnabledChanged = this.commentsEnabled !== (this.postToEdit.commentsEnabled ?? true);
    if((textPost === '' || textPost.length > this.maxLegthTextPost) && (this.listNewMediaFile.length === 0
      && this.listOldMediaFile.length === 0 && this.listNewDocFile.length === 0) && !commentsEnabledChanged){
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
      this.listOldMediaFile = this.postToEdit.content.media;
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
    let responseDoc: Media;
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
    if(valueFormPost.contentPost != '' || this.listOldMediaFile.length > 0 || this.listNewMediaFile.length > 0 || this.listNewDocFile.length > 0){

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
            editedPost.content.media = this.listOldMediaFile;

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

            editedPost.content.media = [...this.listOldMediaFile];

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
      }else if(valueFormPost.contentPost != '' || this.listOldMediaFile.length > 0 || this.listOldMediaFile.length === 0){//Si solo tiene texto O si se eliminaron medios
        // Usar directamente listOldMediaFile que ya contiene solo los medios que NO fueron eliminados
        // O si fueron eliminados listOldMediaFile es un []
        editedPost.content.media = [...this.listOldMediaFile];

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
