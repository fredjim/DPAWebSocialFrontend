import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
import { PostService } from '../../services/post.service';
import { Modal } from 'bootstrap';
import * as bootstrap from 'bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { concatMap, Subject, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../models/uploaded-media';
import { CreatePost } from '../../models/create-post';
import { Institution } from '../../models/institution';
import moment from 'moment';
import { CommentConfig } from '../../models/comment-config';
import { TenantService } from '../../../services/tenant.service';
import { UserDetail } from '../../models/user-detail';
import imageCompression from 'browser-image-compression';
import { CustomToastComponent } from '../../../shared/components/custom-toast/custom-toast.component';
import { Post } from '../../models/post';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-create-post',
  templateUrl: './create-post.component.html',
  styleUrl: './create-post.component.scss'
})
export class CreatePostComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  private modalHiddenListener!: () => void;
  institution!: Institution;
  commentConfig!: CommentConfig[];
  selectedCommentConfig!: string;
  visibleAreaMedia = signal(false); //Mostrar seleccion y prevista de imagenes
  visibleAreaMediaDoc = signal(false); //Mostrar seleccion y prevista de documentos
  disableLoadImage = signal(false); //Deshabilitar el boton de cargar imagenes
  disableLoadDoc = signal(false); //Deshabilitar el boton de cargar documentos
  disabledPublishButton = signal(true); //Deshabilitar el boton de publicar
  postForm!: FormGroup;
  listFile!: File[];
  fileDoc!: File | null;
  isFbSwitchOn: boolean = false;
  currentUser!: UserDetail;
  currentPostType!: string;
  @ViewChild('modalCreatePost') modalCreatePost!: ElementRef;
  private modalInstance: bootstrap.Modal | null = null;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;
  public visibleModalCreate: boolean = false;
  public maxLengthText = 1200;
  public isLoading: boolean = false;
  @Output() onCreatePost = new EventEmitter<Post>();

  constructor(
    private readonly postService: PostService,
    private readonly formBuilder: FormBuilder,
    private readonly tenantService: TenantService
  ) { }

  ngOnInit() {
    this.tenantService.getInstitution()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institutionData: Institution) => {
          this.institution = institutionData;
        },
        error: (error) => {
          console.log(error);
        }
      });
    //Obtener la configuracion de comentarios
    this.postService.getCommentsConfiguration()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (commentsConfiguration: CommentConfig[]) => {
          this.commentConfig = commentsConfiguration;
          this.selectedCommentConfig = this.commentConfig[0].uuid;//Por defecto todos comentan
        },
        error: (error) => {
          console.log('Error al obtener la configuracion de comentarios', error)
        }
      });
    this.getTypeByRol()
    this.buildForm()
  }

  ngAfterViewInit(): void {
    this.modalHiddenListener = () => {
      this.visibleModalCreate = false;
      this.selectedCommentConfig = this.commentConfig[0].uuid;
      this.postForm.get('switchControl')?.setValue(false);
    };
    this.modalCreatePost.nativeElement.addEventListener('hidden.bs.modal', this.modalHiddenListener);
  }

  private buildForm() {
    this.postForm = this.formBuilder.group({
      contentPost: ['', [Validators.maxLength(this.maxLengthText)]],
      media: [[]],
      mediaDoc: [[]],
      switchControl: [false]
    });
    this.postForm.get('switchControl')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.onSwitchChange(value);
      });
  }

  onSwitchChange(value: boolean) {
    this.isFbSwitchOn = value;
  }

  openModalCreatePost() {
    this.modalInstance = new bootstrap.Modal(this.modalCreatePost.nativeElement);
    this.modalInstance.show();
    this.visibleModalCreate = true;
    this.disabledPublishButton.set(true);
  }

  closeModalCreatePost() {
    this.modalInstance?.hide();
  }

  //Deshabilitar el boton de publicar si no hay texto
  getTextPost(text: string) {
    this.postForm.get('contentPost')?.setValue(text);
    text === '' || text.length > this.maxLengthText ? this.disabledPublishButton.set(true) : this.disabledPublishButton.set(false);
  }

  //Mostrar area de imagenes y deshabilitar el boton de cargar documentos
  showAreaMedia() {
    this.visibleAreaMedia.set(true);
    
    // Siempre deshabilitar la opción de documentos cuando se está trabajando con imágenes
    this.disableLoadDoc.set(true);
  }

  //Ocultar area de imagenes
  closeAreaMedia(option: boolean) {
    this.disableLoadDoc.set(option); //Habilitar el boton de cargar documentos
    
    // Actualizar estado del botón de publicar basado en el texto y la lista de archivos
    const contentPost = this.postForm.get('contentPost')?.value;
    const hasMedia = this.listFile && this.listFile.length > 0;
    this.disabledPublishButton.set(!(contentPost != '' || hasMedia));
    
    // Ya no limpiamos la lista de archivos para permitir acumular medios
  }

  //Actualizar la lista de archivos y habilitar/deshabilitar el botón de publicar
  getFilesImagesPost(fileMedia: File[]) {
    this.listFile = fileMedia;
    const contentPost = this.postForm.get('contentPost')?.value;
    // Habilitar el botón de publicar si hay texto o si hay archivos seleccionados
    this.disabledPublishButton.set(!(contentPost != '' || (this.listFile && this.listFile.length > 0)));
  }

  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc() {
    this.visibleAreaMediaDoc.set(true);
    this.disableLoadImage.set(true);
  }

  //Ocultar area de documentos
  closeAreaDoc(option: boolean) {
    this.disableLoadImage.set(option);
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost === '' ? this.disabledPublishButton.set(true) : this.disabledPublishButton.set(false);
    this.fileDoc = null;//Limpiar el archivo
  }

  //Deshabilitar el boton de publicar si no hay archivo
  getFileDocPost(doc: File) {
    this.fileDoc = doc;
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost != '' || this.fileDoc ? this.disabledPublishButton.set(false) : this.disabledPublishButton.set(true);
  }

  // Cerrar modal con boton X (data-bs-dismiss="modal")
  closeModal(): void {
    this.postForm.reset();
    this.listFile = [];
    this.fileDoc = null;
    this.disabledPublishButton.set(true);
  }

  showLoading() {
    this.isLoading = true;
  }

  hideLoading() {
    this.isLoading = false
  }

  getTypeByRol() {
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

  ngOnDestroy(): void {
    this.modalCreatePost.nativeElement.removeEventListener('hidden.bs.modal', this.modalHiddenListener);
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
      case 'ADMIN_CUDIE':
        return 'CUDIE'
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

  async post() {
    const valueFormPost = this.postForm.value;
    const formData = new FormData();
    const post: CreatePost = {
      institution_id: this.institution.uuid,
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      comment_config_id: this.selectedCommentConfig,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost.trim(),
        media: []
      },
      fb_post_enable: this.isFbSwitchOn
    };

    if (valueFormPost.contentPost != '' || this.listFile || this.fileDoc) {
      this.showLoading();

      if (this.listFile && this.listFile.length > 0) {
        const optimizedFiles = await this.optimizeImages(this.listFile).catch(() => this.listFile);

        Array.from(optimizedFiles).forEach((file) => {
          file.type.includes('image') ? formData.append('images', file) : formData.append('videos', file);
        });

        this.postService.uploadMedia(formData).pipe(
          concatMap((uploadResponse: UploadedMedia[]) => {
            post.content.media = uploadResponse.map((media, index) => ({
              number: index + 1,
              type: media.mimeType.includes('image') ? 'image' : 'video',
              file_name: media.name,
              uploaded_file_uuid: media.uuid
            }));
            return this.postService.createPost(post);
          })
        ).subscribe({
          next: (createdPost) => this.createSuccessPost(createdPost),
          error: (error: HttpErrorResponse) => this.createErrorPost('Error al crear publicación con media', error)
        });

      } else if (this.fileDoc && this.fileDoc.size > 0) {
        formData.append('file', this.fileDoc);

        this.postService.uploadDocument(formData).pipe(
          concatMap((uploadResponse: UploadedMedia) => {
            post.content.media = [{
              number: 1,
              type: 'document',
              file_name: uploadResponse.name,
              uploaded_file_uuid: uploadResponse.uuid
            }];
            return this.postService.createPost(post);
          })
        ).subscribe({
          next: (createdPost) => this.createSuccessPost(createdPost),
          error: (error: HttpErrorResponse) => this.createErrorPost('Error al crear el publicación con archivo', error)
        });

      } else if (valueFormPost.contentPost != '') {
        this.postService.createPost(post).subscribe({
          next: (createdPost) => this.createSuccessPost(createdPost),
          error: (error: HttpErrorResponse) => this.createErrorPost('Error al subir publicación solo texto', error)
        });
      }
    }
  }

  private createSuccessPost(createdPost: Post): void {
    this.hideLoading();
    this.closeModalCreatePost();
    this.onCreatePost.emit(createdPost)
    this.toastRef.showSuccess('Publicación creada exitosamente', 'Exitoso');
  }

  private createErrorPost(errorMsg: string, error: HttpErrorResponse): void {
    this.hideLoading(); 
    this.toastRef.showError(errorMsg, 'Error');
    console.log(errorMsg, error); 
  }
}
