import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, signal, ViewChild } from '@angular/core';
import { UserStateService } from '../../../core/services/user-state.service';
import { PostService } from '../../services/post.service';
import { Modal } from 'bootstrap';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { concatMap, forkJoin, Observable, of, Subject, takeUntil } from 'rxjs';
import { UploadedMedia } from '../../../shared/models/uploaded-media';
import { CreatePost } from '../../models/create-post';
import { Institution } from '../../../shared/models/institution';
import moment from 'moment';
import { OwnInstitutionStateService } from '../../../core/services/own-institution-state.service';
import { UserDetail } from '../../../shared/models/user-detail';
import { ImageOptimizationService } from '../../../shared/services/image-optimization.service';
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
  commentsEnabled: boolean = true;
  visibleAreaMedia = signal(false); //Mostrar seleccion y prevista de imagenes
  visibleAreaMediaDoc = signal(false); //Mostrar seleccion y prevista de documentos
  disabledPublishButton = signal(true); //Deshabilitar el boton de publicar
  postForm!: FormGroup;
  listFile: File[] = [];
  listFileDoc: File[] = [];
  isFbSwitchOn: boolean = false;
  currentUser!: UserDetail;
  currentPostType: string = 'GENERAL';
  @ViewChild('modalCreatePost') modalCreatePost!: ElementRef;
  private modalInstance: Modal | null = null;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;
  public visibleModalCreate: boolean = false;
  public maxLengthText = 1200;
  public isLoading: boolean = false;
  @Output() onCreatePost = new EventEmitter<Post>();

  constructor(
    private readonly postService: PostService,
    private readonly userStateService: UserStateService,
    private readonly formBuilder: FormBuilder,
    private readonly ownIsntitutionStateService: OwnInstitutionStateService,
    private readonly imageOptimizationService: ImageOptimizationService
  ) { }

  ngOnInit() {
    this.ownIsntitutionStateService.ownInstitution$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (institutionData) => {
          if(!institutionData) return;
          this.institution = institutionData;
        },
        error: (error) => {
          console.log(error);
        }
      });
    this.getTypeByRol()
    this.buildForm()
  }

  ngAfterViewInit(): void {
    this.modalHiddenListener = () => {
      this.visibleModalCreate = false;
      this.commentsEnabled = true;
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

    if(value){
      this.checkListFileForFacebook();
    }else if(this.listFile.length > 0 || this.listFileDoc.length > 0 || this.postForm.value.contentPost !== ''){
      this.disabledPublishButton.set(false);
    }else{
      this.disabledPublishButton.set(true);
    }
  }

  private checkListFileForFacebook(): void {
    const videoCount = this.listFile.filter(file => file.type.includes('video')).length;
    const imageCount = this.listFile.filter(file => file.type.includes('image')).length;

    const hasVideoWithImages = videoCount >= 1 && imageCount >= 1;
    const hasMoreThanOneVideo = videoCount > 1;

    if (hasVideoWithImages || hasMoreThanOneVideo) {
      this.disabledPublishButton.set(true);
      this.toastRef.showWarn(
        'Solo se permite 1 video sin imágenes, o solo imágenes sin videos.',
        'Restricciones de Facebook'
      );
    }
  }

  openModalCreatePost() {
    this.modalInstance = new Modal(this.modalCreatePost.nativeElement);
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
  }

  //Ocultar area de imagenes
  closeAreaMedia() {
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

    // Desabilitar el boton Publicar si el switchFace == true y incumple restricciones
    if(this.isFbSwitchOn){
      this.checkListFileForFacebook();
    }
  }

  //Mostrar area de documentos y deshabilitar el boton de cargar imagenes
  showAreaDoc() {
    this.visibleAreaMediaDoc.set(true);
  }

  //Ocultar area de documentos
  closeAreaDoc() {
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost === '' ? this.disabledPublishButton.set(true) : this.disabledPublishButton.set(false);
    this.listFileDoc = [];//Limpiar el archivo
  }

  //Deshabilitar el boton de publicar si no hay archivo
  getFileDocPost(docs: File[]) {
    this.listFileDoc = docs;
    const contentPost = this.postForm.get('contentPost')?.value;
    contentPost != '' || this.listFileDoc.length > 0 ? this.disabledPublishButton.set(false) : this.disabledPublishButton.set(true);

    // Desabilitar el boton Publicar si el switchFace == true y incumple restricciones
    if(this.isFbSwitchOn){
      this.checkListFileForFacebook();
    }
  }

  // Cerrar modal con boton X (data-bs-dismiss="modal")
  closeModal(): void {
    this.postForm.reset();
    this.listFile = [];
    this.listFileDoc = [];
    this.disabledPublishButton.set(true);
  }

  getTypeByRol() {
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
    this.modalCreatePost.nativeElement.removeEventListener('hidden.bs.modal', this.modalHiddenListener);
    this.destroy$.next();
    this.destroy$.complete();
  }

  async post() {
    this.isLoading = true;
    const valueFormPost = this.postForm.value;

    const post: CreatePost = {
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      commentsEnabled: this.commentsEnabled,
      post_type: this.currentPostType,
      content: {
        text: valueFormPost.contentPost.trim(),
        media: []
      },
      fb_post_enable: this.isFbSwitchOn
    };

    const hasMedia = this.listFile && this.listFile.length > 0;
    const hasDocs = this.listFileDoc && this.listFileDoc.length > 0;
    const hasText = valueFormPost.contentPost !== '';

    if (!hasText && !hasMedia && !hasDocs) {
      this.isLoading = false;
      return;
    }

    // Upload de imágenes/videos (con optimización previa), si corresponde
    let mediaUpload$: Observable<UploadedMedia[]> = of([]);
    if (hasMedia) {
      const optimizedFiles = await this.imageOptimizationService
        .optimizeImages(this.listFile)
        .catch(() => this.listFile);

      const formDataMedia = new FormData();
      Array.from(optimizedFiles).forEach((file: File) => {
        file.type.includes('image')
          ? formDataMedia.append('images', file)
          : formDataMedia.append('videos', file);
      });

      mediaUpload$ = this.postService.uploadMedia(formDataMedia);
    }

    // Upload de documentos, si corresponde
    let docsUpload$: Observable<UploadedMedia[]> = of([]);
    if (hasDocs) {
      const formDataDocs = new FormData();
      Array.from(this.listFileDoc).forEach((file: File) => {
        formDataDocs.append('files', file);
      });

      docsUpload$ = this.postService.uploadDocument(formDataDocs);
    }

    // Ambos uploads en paralelo (los que no aplican resuelven de inmediato con [])
    forkJoin([mediaUpload$, docsUpload$]).pipe(
      concatMap(([mediaResults, docResults]) => {
        const mediaItems = mediaResults.map((media, index) => ({
          number: index + 1,
          type: media.mimeType.includes('image') ? 'image' : 'video',
          file_name: media.name,
          uploaded_file_uuid: media.uuid
        }));

        const docItems = docResults.map((media, index) => ({
          number: mediaItems.length + index + 1,
          type: 'document',
          file_name: media.name,
          uploaded_file_uuid: media.uuid
        }));

        post.content.media = [...mediaItems, ...docItems];

        return this.postService.createPost(post);
      })
    ).subscribe({
      next: (createdPost) => this.createSuccessPost(createdPost),
      error: (error: HttpErrorResponse) => this.createErrorPost('Error al crear la publicación', error)
    });
  }

  private createSuccessPost(createdPost: Post): void {
    this.isLoading = false;
    this.closeModalCreatePost();
    this.onCreatePost.emit(createdPost)
    this.toastRef.showSuccess('Publicación creada exitosamente', 'Exitoso');
  }

  private createErrorPost(errorMsg: string, error: HttpErrorResponse): void {
    this.isLoading = false;
    this.toastRef.showError(errorMsg, 'Error');
    console.log(errorMsg, error); 
  }
}
