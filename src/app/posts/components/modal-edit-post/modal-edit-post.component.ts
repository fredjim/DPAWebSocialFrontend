import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, signal, ViewChild, WritableSignal } from '@angular/core';
import { Subject, takeUntil, concatMap } from 'rxjs';
import { Institution } from '../../models/institution';
import { Post } from '../../models/post';
import { CommentConfig } from '../../models/comment-config';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PostService } from '../../services/post.service';
import { Media } from '../../models/media';
import { CreatePost } from '../../models/create-post';
import { UploadedMedia } from '../../models/uploaded-media';
import { FbUploadedMedia } from '../../models/fb-uploaded-media';
import { Modal } from 'bootstrap';
import { UserDetail } from '../../models/user-detail';
import { AuthService } from '../../../authentication/services/auth.service';
import imageCompression from 'browser-image-compression';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';

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
  public commentConfig!: CommentConfig[];
  public selectedCommentConfig!: string;
  public maxLegthTextPost = 1200;
  public visibleAreaMedia = signal(false); //Mostrar seleccion y prevista de imagenes
  public visibleAreaMediaDoc = signal(false); //Mostrar seleccion y prevista de documentos

  public disableLoadImage = signal(false); //Deshabilitar el boton de cargar imagenes
  public disableLoadDoc = signal(false); //Deshabilitar el boton de cargar documentos

  public disabledSaveButton = signal(true); //Deshabilitar el boton de guardar
  public postForm!: FormGroup;
  private listNewMediaFile: File[] = []; //Lista de media editada obtenida de 'image-video-editor' component
  private listOldMediaFile!: Media[]; //Lista de media editada que existe en el post
  private fileNewDoc: File | null = null;  //Doc añadido en edicion
  private readonly fbMediaResponse!: FbUploadedMedia;
  private currentUser!: UserDetail;
  private currentPostType!: string;
  private isAuthenticated: boolean = false;
  public typeMedia = {
    img_vid : 'images-videos',
    doc: 'document'
  }

  constructor(
      private readonly postService: PostService,
      private readonly formBuilder: FormBuilder,
      private readonly authService: AuthService
  ){}

  ngOnInit(){
    //Obtener la configuracion de comentarios
    this.postService.getCommentsConfiguration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commentsConfiguration: CommentConfig[])=>{
          this.commentConfig = commentsConfiguration;
          this.selectedCommentConfig = this.postToEdit.comment_config_id;//Configuracion de comentarios del post
        },
        error: (error)=>{
          console.log('Error al obtener la configuracion de comentarios', error)
        }
      });
    this.getTypeByRol()
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
    this.fileNewDoc = null;//Limpiar el archivo
    this.listOldMediaFile = [];
    this.checkDisableSaveButton();
  }
  
  //Establecer el Doc editado y verificar deshabilitar boton Guardar
  setFileDocPostAdded(doc: File){
    this.fileNewDoc = doc;
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
    if((textPost === '' || textPost.length > this.maxLegthTextPost) && (this.listNewMediaFile.length === 0 
      && this.listOldMediaFile.length === 0 && !this.fileNewDoc)){
      this.disabledSaveButton.set(true);
    }else{
      this.disabledSaveButton.set(false);
    }
  }

  public changedSelectConfigComment(): void {
    this.checkDisableSaveButton();
  }

  //Cerrar modal sin guardar cambios
  closeResetModalEdit(id: string){
    const modalElement = document.getElementById('edit-'+id);
    if (modalElement) {
      let modal = Modal.getInstance(modalElement);
      modal?.hide();
      this.selectedCommentConfig = this.postToEdit.comment_config_id;
      this.showModalEdit.set(false);
      this.listNewMediaFile = [];
      this.fileNewDoc = null;
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

  getTypeByRol() {
    this.isAuthenticated = this.authService.isAuthenticated();
    if (this.isAuthenticated) {
      this.postService.getUser()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next:(user: UserDetail) => {
            this.currentUser = user;
            this.currentPostType = this.determinePostType(this.currentUser.role);
          },
          error:(error) => {
            console.error('Error al obtener el usuario actual', error);
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private determinePostType(role: string): string {
    switch (role) {
      case 'ADMIN_BECAS':
        return 'BECAS';
      case 'ADMIN_CONVENIOS':
        return 'CONVENIOS';
      case 'ADMIN_PROYECTOS':
        return 'PROYECTOS';
      default:
        return 'GENERAL';
    }
  }

  private async optimizeImages(files: File[]): Promise<File[]> {
    const compressionOptions = {
      maxSizeMB: 1, // Máximo 1MB por imagen
      maxWidthOrHeight: 1920, // Resolución máxima
      useWebWorker: true, // No bloquear UI
      fileType: 'image/webp', // Convertir a WebP
      initialQuality: 0.8, // Calidad 80%
      alwaysKeepResolution: false,
      preserveExif: false
    };

    // Optimizar cada imagen en paralelo
    const optimizationPromises = files.map(async (file, index) => {
      if (!file.type.includes('image')) {
        return file; // Si no es imagen, devolver sin cambios
      }

      // Si ya es WebP y es pequeño, no optimizar
      if (file.type === 'image/webp' && file.size < 1024 * 500) { // < 500KB
        console.log(`Imagen ${file.name} ya es WebP y pequeña, omitiendo optimización`);
        return file;
      }

      try {
        // Optimizar la imagen
        const compressedFile = await imageCompression(file, compressionOptions);
        
        // Mantener el nombre original pero cambiar extensión a .webp
        const originalName = file.name.replace(/\.[^/.]+$/, "");
        const optimizedName = `${originalName}_optimized_${Date.now()}.webp`;
        
        return new File([compressedFile], optimizedName, {
          type: 'image/webp'
        });
        
      } catch (error) {
        console.warn(`No se pudo optimizar ${file.name}:`, error);
        return file; // Fallback al archivo original
      }
    });

    // Esperar a que todas se optimicen
    const results = await Promise.all(optimizationPromises);
    return results.filter((file): file is File => file !== null);
  }
  
  async updatePost(){
    const valueFormPost = this.postForm.value;
    const formData = new FormData();
    const responseMedia: Media[] = []; //Respuesta de imagenes y videos guardados
    let responseDoc: Media;
    const editedPost: CreatePost = {
      institution_id: this.institution.uuid,
      date: this.postToEdit.date,
      comment_config_id: this.selectedCommentConfig,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost,
        media: []
      },
      is_fb_posted: false,
      fb_post_enable: false
    }

    //Si hay info para postear (texto, imagen o video, documento)
    if(valueFormPost.contentPost != '' || this.listOldMediaFile.length > 0 || this.listNewMediaFile.length > 0 || this.fileNewDoc){

      //Si hay nuevas imagenes-videos se los procesa Y imgs-videos eliminados se actualiza
      if(this.listNewMediaFile && this.listNewMediaFile.length > 0){ 

        try {
          // 1. Optimizar nuevas imágenes
          const optimizedFiles = await this.optimizeImages(this.listNewMediaFile);
          
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
                type: media.mimeType,
                name: media.name,
                uploaded_file_uuid: media.uuid,
                path: media.urlResource,
                fb_media_id: this.fbMediaResponse ? this.fbMediaResponse.id : ''
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
          next: (responseUpdatedPost)=> {
            console.log('post con nuevas imagenes videos actualizado',responseUpdatedPost);
            globalThis.location.reload();
          },
          error: (error) => {
            this.toastRef.showError('Error al actualizar publicación', 'Error');
            console.log('Error al actualizar el post con contenido media (imagenes y/o videos)', error)
          }
        })
      }else if(this.fileNewDoc && this.fileNewDoc.size > 0){//Si hay un archivo
        //Convertir el archivo en form data
        formData.append('file', this.fileNewDoc);

        this.postService.uploadDocument(formData).pipe(
          concatMap((uploadResponse: UploadedMedia) => {
  
            responseDoc = {
              number: 1,
              type: 'document',//uploadResponse.mimeType,
              name: uploadResponse.name,
              path: uploadResponse.urlResource,
              uploaded_file_uuid: uploadResponse.uuid,
              fb_media_id: ''
            }
            
            editedPost.content.media.push(responseDoc);
            editedPost.is_fb_posted = false;
            editedPost.fb_post_enable = false;
            return this.postService.updatePost(this.postToEdit.uuid, editedPost);
          })
        ).subscribe({
          next: (responseUpdatedPost)=> {
            console.log('post con archivo actualizado',responseUpdatedPost);
            globalThis.location.reload();
          },
          error: (error) => {
            this.toastRef.showError('Error al actualizar publicación', 'Error');
            console.log('Error al actualizar el post con archivo',error)
          }
        })      
      }else if(valueFormPost.contentPost != '' || this.listOldMediaFile.length > 0){//Si solo tiene texto O si se eliminaron medios
        // Usar directamente listOldMediaFile que ya contiene solo los medios que NO fueron eliminados
        // O si fueron eliminados listOldMediaFile es un []
        editedPost.content.media = [...this.listOldMediaFile];

        this.postService.updatePost(this.postToEdit.uuid, editedPost).subscribe({
          next: (responseUpdatedPost) => {
            console.log('post actualizado',responseUpdatedPost);
            globalThis.location.reload();
          },
          error: (error) => {
            this.toastRef.showError('Error al actualizar publicación', 'Error');
            console.log('Error al actualizar post', error)
          }
        })
      }
    }
  }
}
