import { ChangeDetectorRef, Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Article } from '../models/article';
import { InformationService } from '../services/information.service';
import { CustomToastComponent } from '../../shared/components/custom-toast/custom-toast.component';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { catchError, debounceTime, forkJoin, from, fromEvent, map, of, Subject, switchMap, takeUntil, throwError } from 'rxjs';
import { PostService } from '../../posts/services/post.service';
import { UploadedMedia } from '../../posts/models/uploaded-media';
import { MediaArticle } from '../models/media-article';
import { Link } from '../models/link';
import imageCompression from 'browser-image-compression';
import { CreateUpdateArticle } from '../models/create-update-article';

@Component({
  selector: 'app-edit-info',
  templateUrl: './edit-info.component.html',
  styleUrl: './edit-info.component.scss'
})
export class EditInfoComponent implements OnInit, OnChanges, OnDestroy {
  private initTimeout?: ReturnType<typeof setTimeout>;
  private readonly postService = inject(PostService);
  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() currentArticle!: Article | undefined;
  @Input() currentSectionUuid!: string;
  @Output() onCloseEdit = new EventEmitter<void>();
  @Output() onCloseNew = new EventEmitter<boolean>();
  @Output() onEditedArticle = new EventEmitter<Article>();
  @Output() onDeletedArticle = new EventEmitter<Article>();
  @Output() onCreateArticle = new EventEmitter<Article>();
  @Output() onComponentReady = new EventEmitter<void>();
  @ViewChild('fileInputImg') fileInputImage!: ElementRef;
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInputDocument') fileInputDoc!: ElementRef;
  @ViewChild('toastRef') private readonly toastRef!: CustomToastComponent;

  public imgsPreview: {name: string, type: string, url: string}[] = [];
  public imagesOfArticle: MediaArticle[] = []; // imagenes del articulo actual para renderizar
  private imageFilesToCreate: File[] = []; //imagenes para subir al articulo
  
  public docsPreview: {name: string, type: string, url: string}[] = [];
  public docsOfArticle: MediaArticle[] = []; // docs del articulo para renderizar
  private docsToCreate: File[] = [];

  public typeDocs = ['document', 'application/pdf'];
  
  public isLoading = false;

  public formArticle = new FormGroup({
    title: new FormControl(''),
    text: new FormControl(''),
  });

  public buttonsOfArticle: Link[] = [];
  public buttonsToAdd: { name: string, url: string }[] = []; // Para crear articulo
  // Modal de agregar botones
  public visibleModalAddButton = false;
  public disableButtonSaveArticle = false;
  private isArticleEmpty = true;

  private modeEdit: 'load' | 'preload' = 'load'; // Modo de edicion de un boton ya guardado en BD o uno pre cargado 
  private indexButton: undefined | number;
  public typeModalButton: 'create' | 'edit' = 'create'; //Tipo de modal de para un boton


  public formNewButton = new FormGroup({
    name: new FormControl('', [Validators.required]),
    url: new FormControl('', [Validators.required])
  });

  public maxLengthTextArticle: number = 3000;
  public currentLength: number = 0;
  public isExceeded: boolean = false;

  private quillInstance: any;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly informationService: InformationService,
    private readonly cdr: ChangeDetectorRef
  ){}

  ngOnInit(): void {
    this.initTimeout = setTimeout(() => {
      this.onComponentReady.emit();
      this.focusInputIfNeeded();
    });
  }

  ngOnDestroy(): void {
    if (this.initTimeout) {
      clearTimeout(this.initTimeout);
    }
    this.destroy$.next(); // Emitir señal para cancelar suscripciones
    this.destroy$.complete(); // Cerrar el Subject
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentArticle'] && this.currentArticle && this.formArticle && this.typeForm === 'edit'){
      this.formArticle.patchValue({
        title: this.currentArticle.title,
        text: this.currentArticle.text
      });
      this.imagesOfArticle = this.currentArticle.medias.filter(media => media.type.includes('image'));
      this.docsOfArticle = this.currentArticle.medias.filter(media => this.typeDocs.includes(media.type));
      this.buttonsOfArticle = structuredClone(this.currentArticle.links);
    }
  }

  onEditorInit(event: any): void {
    this.quillInstance = event.editor; // Instancia de Quill
    
    // Actualizar contador inicial
    this.updateCharCount();
    
    // Usar fromEvent para convertir evento Quill en Observable
    fromEvent(this.quillInstance, 'text-change')
      .pipe(
        debounceTime(500),           // Esperar 500ms de pausa
        takeUntil(this.destroy$)     // Auto-limpiar al destruir
      )
      .subscribe(() => {
        this.updateCharCount();
        this.cdr.detectChanges();    // Forzar actualización de vista
      });
  }

  public onSubmit(): void {
    // Validar límite (aunque botón esté deshabilitado)
    if (this.isExceeded) {
      this.toastRef.showError(`El texto excede el límite de ${this.maxLengthTextArticle} caracteres. Actual: ${this.currentLength}`, 'Error de validación');
      return; 
    }

    this.checkArticleEmpty();
    if(this.isArticleEmpty) return;

    // SOLO AQUÍ obtenemos el HTML definitivo para enviar
    const htmlContent = this.quillInstance.root.innerHTML;
    const cleanHtml = this.normalizeSpaces(htmlContent);
    this.formArticle.patchValue({ text: cleanHtml });

    if(this.typeForm === 'edit'){
      this.updatedArticle();
    }else if(this.typeForm === 'create'){
      this.createArticle();
    }
  }

  private createArticle(): void {
    if (this.imageFilesToCreate.length === 0 && this.docsToCreate.length === 0) {
      this.createArticleWithoutImagesDocs();
      return;
    }

    this.isLoading = true;

    const uploadImages$ = this.imageFilesToCreate.length > 0
      ? from(this.optimizeImages(this.imageFilesToCreate)).pipe(
          switchMap(optimizedImages => {
            const formData = new FormData();
            optimizedImages.forEach(file => {
              if (file.type.includes('image')) {
                formData.append('images', file);
              }
            });
            return this.postService.uploadImages(formData);
          }),
          map((uploadResponse: UploadedMedia[]) =>
            uploadResponse.map((media, index) => ({
              number: index + 1,
              type: media.mimeType,
              file_name: media.name,
              uploaded_file_uuid: media.uuid,
            }))
          ),
          catchError(error => {
            console.error('Error en imágenes:', error);
            // throwError mensaje + error identificable en subscribe
            return throwError(() => Object.assign(new Error('IMAGE_UPLOAD_FAILED'), { cause: error }));
          })
        )
      : of([]);

    const uploadDocs$ = this.docsToCreate.length > 0
      ? of(this.docsToCreate).pipe(
          switchMap(docs => {
            const formDataDocs = new FormData();
            docs.forEach(file => {
              formDataDocs.append('files', file);
            });
            return this.informationService.uploadDocumentsForArticle(formDataDocs);
          }),
          map(uploadResponse =>
            uploadResponse.map((media, index) => ({
              number: index + 1,
              type: 'document',
              file_name: media.name,
              uploaded_file_uuid: media.uuid,
            }))
          ),
          catchError(error => {
            console.error('Error en documentos:', error);
            // throwError mensaje + error identificable en subscribe
            return throwError(() => Object.assign(new Error('DOC_UPLOAD_FAILED'), { cause: error }));
          })
        )
      : of([]);

    forkJoin({
      images: uploadImages$,
      docs: uploadDocs$
    }).pipe(
      switchMap(({ images, docs }) => {
        const newArticle = {
          section_id: this.currentSectionUuid,
          date: '',
          title: this.formArticle.value.title?.trim() ?? '',
          text: this.formArticle.value.text?.trim() ?? '',
          medias: [...images, ...docs],
          links: this.buttonsToAdd
        };
        return this.informationService.createArticle(newArticle);
      })
    ).subscribe({
      next: (articleCreated) => {
        this.isLoading = false;
        this.onCreateArticle.emit(articleCreated);
        this.closeEdit();
      },
      error: (error) => {
        this.isLoading = false;

        // Mensaje de error específico
        let errorDetail = 'Error al crear artículo';
        if (error.message === 'IMAGE_UPLOAD_FAILED') {
          errorDetail = 'Error al subir las imágenes';
        } else if (error.message === 'DOC_UPLOAD_FAILED') {
          errorDetail = 'Error al subir los documentos';
        }
        // Acceder al error HTTP original via error.cause
        console.error('Error al crear artículo:', error.cause ?? error);
        this.toastRef.showError(errorDetail, 'Error');
      }
    });
  }

  private createArticleWithoutImagesDocs(): void {
    this.isLoading = true;
    const newArticle: Omit<Article, 'uuid' | 'user_id' | 'links'> & {links: Array<Omit<Link, 'uuid'>> } = {
      section_id: this.currentSectionUuid,
      date: '',
      title: this.formArticle.value.title?.trim() ?? '',
      text: this.formArticle.value.text?.trim() ?? '',
      medias: [],
      links: this.buttonsToAdd
    }
    
    this.informationService.createArticle(newArticle).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.onCreateArticle.emit(created);
        this.closeEdit();
      },
      error: (err) => {
        this.isLoading = false;
        console.log('Error al crear articulo', err);
        this.toastRef.showError('Error al crear artículo', 'Error');
      }
    })
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

  private updatedArticle(): void {
    if (!this.currentArticle) return;

    if (this.imageFilesToCreate.length === 0 && this.docsToCreate.length === 0) {
      this.updateArticleWithoutNewImagesDocs();
      return;
    }

    this.isLoading = true;

    // Crear observables para cada operación
    const uploadImages$ = this.imageFilesToCreate.length > 0
      ? from(this.optimizeImages(this.imageFilesToCreate)).pipe(
          switchMap(optimizedImages => {
            const formData = new FormData();
            optimizedImages.forEach(file => {
              if (file.type.includes('image')) {
                formData.append('images', file);
              }
            });
            return this.postService.uploadImages(formData);
          }),
          map((uploadResponse: UploadedMedia[]) =>
            uploadResponse.map((media, index) => ({
              number: index + 1,
              file_name: media.name,
              type: 'image/webp',
              uploaded_file_uuid: media.uuid,
            }))
          ),
          catchError(error => {
            console.error('Error al subir imágenes:', error);
            //Propagar el error
            return throwError(() => error);
          })
        )
      : of([]);

    const uploadDocs$ = this.docsToCreate.length > 0
      ? of(this.docsToCreate).pipe(
          switchMap(docs => {
            const formDataDocs = new FormData();
            docs.forEach(file => {
              formDataDocs.append('files', file);
            });
            return this.informationService.uploadDocumentsForArticle(formDataDocs);
          }),
          map(uploadResponse =>
            uploadResponse.map((media, index) => ({
              number: index + 1,
              file_name: media.name,
              type: 'document',
              uploaded_file_uuid: media.uuid,
            }))
          ),
          catchError(error => {
            console.error('Error al subir documentos:', error);
            return throwError(() => error);
          })
        )
      : of([]);

    // Combinar ambas operaciones
    forkJoin({
      images: uploadImages$,
      docs: uploadDocs$
    }).pipe(
      switchMap(({ images, docs }) => {
        // Construir el artículo actualizado
        const articleUpdated: CreateUpdateArticle = {
          ...this.currentArticle!,
          title: this.formArticle.value.title?.trim() ?? '',
          text: this.formArticle.value.text?.trim() ?? '',
          medias: [...this.imagesOfArticle, ...images, ...this.docsOfArticle, ...docs],
          links: [...this.buttonsOfArticle, ...this.buttonsToAdd]
        };
        // Actualizar artículo
        return this.informationService.updateArticle(this.currentArticle!.uuid, articleUpdated);
      })
    ).subscribe({
      next: (articleUpdatedResult) => {
        this.isLoading = false;
        this.onEditedArticle.emit(articleUpdatedResult);
        this.closeEdit();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error al actualizar artículo:', error);
        this.toastRef.showError('Error al editar artículo', 'Error');
      }
    });
  }

  private updateArticleWithoutNewImagesDocs(): void {
    if(!this.currentArticle) return;

    this.isLoading = true;
    const articleEdited: Article = {
      ...this.currentArticle,
      title: this.formArticle.value.title?.trim() ?? '',
      text: this.formArticle.value.text?.trim() ?? '',
      medias: [...this.imagesOfArticle, ...this.docsOfArticle],
      links: [...this.buttonsOfArticle, ...this.buttonsToAdd]
    }

    this.informationService.updateArticle(this.currentArticle.uuid, articleEdited).subscribe({
      next: (edited) => {
        this.isLoading = false;
        this.onEditedArticle.emit(edited);
        this.closeEdit();
      },
      error: (err) => {
        this.isLoading = false;
        console.log('Error al editar articulo sin nuevas imagenes', err);
        this.toastRef.showError('Error al editar artículo', 'Error');
      }
    })
  }

  public closeEdit(): void {
    this.clearImagesPreview();
    this.clearDocsPreview();
    this.imageFilesToCreate = [];
    this.docsToCreate = [];
    if(this.typeForm === 'edit'){
      this.buttonsOfArticle = [];
      this.currentArticle = undefined;
      this.resetFileInput(this.fileInputImage);
      this.onCloseEdit.emit();
    }else {
      this.formArticle.reset();
      this.onCloseNew.emit(true);
    }
  }

  private clearImagesPreview(): void {
    if(this.imgsPreview.length > 0){
      for(const img of this.imgsPreview){
        URL.revokeObjectURL(img.url);
      }
      this.imgsPreview = [];
    }
  }

  private clearDocsPreview(): void {
    if(this.docsPreview.length > 0) {
      for(const doc of this.docsPreview){
        URL.revokeObjectURL(doc.url);
      }
      this.docsPreview = [];
    }
  }

  public deleteArticle(): void {
    if(!this.currentArticle) return;

    this.isLoading = true;
    this.informationService.deleteArticle(this.currentArticle.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.onDeletedArticle.emit(this.currentArticle);
        this.onCloseEdit.emit();
        this.currentArticle = undefined;
      },
      error: () => {
        this.isLoading = false;
        this.toastRef.showError('Error al eliminar artículo', 'Error');
      }
    });
  }

  public openInputFileDoc(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    setTimeout(() => {
      this.resetFileInput(this.fileInputDoc);
      this.fileInputDoc?.nativeElement.click();
    }, 10); 
  }

  public openInputFileImg(event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
  
    setTimeout(() => {
      this.resetFileInput(this.fileInputImage);
      this.fileInputImage?.nativeElement.click();
    }, 10);
  }

  private resetFileInput(fileInput: ElementRef): void {
    if (fileInput?.nativeElement) {
      fileInput.nativeElement.value = '';
    }
  }

  public changeInputDocs(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if(event.target instanceof HTMLInputElement && event.target.files){
      // Convertir FileList a array
      const newDocs = Array.from(event.target.files);
      
      // Validar tipos de los nuevos documentos
      if(!this.isValidFileTypeDoc(newDocs)){
        alert('Por favor, seleccione solo documentos pdf');
        this.resetFileInput(this.fileInputDoc);
        return;
      }

      // Crear y acumular previews
      // Acumular nuevos documentos a los ya seleccionados
      for(const doc of newDocs) {
        this.docsToCreate.push(doc);
        this.docsPreview.push({
          name: doc.name, 
          type: doc.type, 
          url: URL.createObjectURL(doc)
        });
      }
      
      // Resetear el input para permitir seleccionar los mismos archivos nuevamente
      this.resetFileInput(this.fileInputDoc);
    }
  }

  private isValidFileTypeDoc(files: File[]): boolean {
    return files.every(file => this.typeDocs.includes(file.type));
  }

  public selectDocumentDeleteOfArticle(index: number): void {
    this.docsOfArticle.splice(index, 1);
  }

  public deleteDocumentPreview(index: number): void {
    this.docsPreview.splice(index, 1);
    this.docsToCreate.splice(index, 1);
  }

  public changeInputMedia(event: Event){
    event.preventDefault();
    event.stopPropagation();
    
    if (event.target instanceof HTMLInputElement && event.target.files){
      // Convertir FileList a array
      const newFiles = Array.from(event.target.files);
      
      // Validar tipos de los nuevos archivos
      if(!this.isValidFileType(newFiles)){
        alert('Por favor, seleccione solo imágenes');
        this.resetFileInput(this.fileInputImage);
        return;
      }
      
      // Crear y acumular previews
      // Acumular nuevas imagenes a las ya seleccionadas
      for(const img of newFiles) {
        this.imageFilesToCreate.push(img);
        this.imgsPreview.push({
          name: img.name, 
          type: img.type, 
          url: URL.createObjectURL(img)
        });
      }
      
      // Resetear el input para permitir seleccionar los mismos archivos nuevamente
      this.resetFileInput(this.fileInputImage);
    }
  }

  private isValidFileType(files: File[]): boolean {
    return files.every(file => {
      const fileType = file.type;
      return fileType.startsWith('image/');
    });
  }

  public selectImageDeleteOfArticle(index: number): void {
    this.imagesOfArticle.splice(index, 1);
  }

  public deleteImagePreview(index: number): void {
    this.imgsPreview.splice(index, 1);
    this.imageFilesToCreate.splice(index, 1);
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }

  // Eliminar boton (BD) desde le icono (sin abrir modal)
  public deleteButton(index: number): void {
    this.buttonsOfArticle.splice(index, 1);
  }

  // Mostrar el modal del boton para crear o editar (boton en BD o local)
  // modeEdit = load -> editar un boton cargado en la BD
  // modeEdit = preload -> editar un boton local
  public showModalNewButton(typeModal: 'create' | 'edit', modeEdit?: 'load' | 'preload', newButton?: {name: string, url: string}, button?: Link, index?: number): void {
    if(typeModal === 'edit' && index !== undefined && index >= 0){
      this.indexButton = index;
      this.typeModalButton = 'edit'; 
      if(modeEdit && modeEdit === 'load' && button){
        this.modeEdit = 'load';
        this.formNewButton.patchValue({
          name: button.name,
          url: button.url
        });
      }else if(modeEdit && modeEdit === 'preload' && newButton){
        this.modeEdit = 'preload';
        this.formNewButton.patchValue({
          name: newButton.name,
          url: newButton.url
        });
      }
    }else if(typeModal === 'create'){
      this.typeModalButton = 'create';
    }
    this.visibleModalAddButton = true;
  }

  public saveNewEditButton(): void {
    if(this.typeModalButton === 'create'){
      this.buttonsToAdd.push({
        name: this.formNewButton.get('name')!.value?.trim() || '',
        url: this.formNewButton.get('url')!.value?.trim() || ''
      });
    }else if(this.typeModalButton === 'edit'){

      if(this.indexButton === undefined) return;
      // Edicion boton en BD (de tipo Link)
      if(this.modeEdit === 'load'){
        this.buttonsOfArticle[this.indexButton].name = this.formNewButton.get('name')!.value ?? '';
        this.buttonsOfArticle[this.indexButton].url = this.formNewButton.get('url')!.value ?? '';

        // Edicion boton en local
      }else if(this.modeEdit === 'preload'){
        this.buttonsToAdd[this.indexButton].name = this.formNewButton.get('name')!.value ?? '';
        this.buttonsToAdd[this.indexButton].url = this.formNewButton.get('url')!.value ?? '';
      }
    }
    this.cancelModalNewButton();
  }

  public preDeleteButton(index: number): void {
    this.buttonsToAdd.splice(index,1);
  }

  public deleteButtonInModal(): void {
    // modeEdit = load -> Boton guardado en BD
    if(this.modeEdit === 'load' && this.indexButton){
      this.buttonsOfArticle.splice(this.indexButton,1);

      // modeEdit = preload -> Boton local 
    }else if(this.modeEdit === 'preload' && this.indexButton){
      this.buttonsToAdd.splice(this.indexButton,1);
    }

    this.cancelModalNewButton();
  }

  public cancelModalNewButton(): void {
    this.formNewButton.reset();
    this.visibleModalAddButton = false;
    this.indexButton = undefined;
  }

  public closeModalNewButton(): void {
    this.cancelModalNewButton();
    this.buttonsOfArticle = this.currentArticle!.links
  }

  private updateCharCount(): void {
    if (!this.quillInstance) return;
    
    // Obtener HTML real que se enviará al backend
    let htmlContent = this.quillInstance.root.innerHTML;
    // Reiniciar las etiquetas por defecto que usa
    if (htmlContent === '<p><br></p>') htmlContent = '';

    this.currentLength = htmlContent.length;
    this.isExceeded = this.currentLength > this.maxLengthTextArticle;

    this.disableButtonSaveArticle = this.isExceeded;
  }

  private normalizeSpaces(html: string): string {
    return html.replace(/&nbsp;/g, ' ');
  }

  private checkArticleEmpty(): void {
    const contentArticleEmpty = this.formArticle.get('title')?.value === '' && 
                                (this.formArticle.get('text')?.value === '' ||
                                 this.formArticle.get('text')?.value === '<p><br></p>' ||
                                 this.formArticle.get('text')?.value === '<p></p>')&&
                                this.imageFilesToCreate.length === 0 && 
                                this.docsToCreate.length === 0 && 
                                this.buttonsToAdd.length === 0;

    if(this.typeForm === 'create'){
      if(contentArticleEmpty){
        this.isArticleEmpty = true;
        this.toastRef.showError('No se puede crear un artículo vacío', 'Error de validación');
      }else{
        this.isArticleEmpty = false;
      }
    }else { // typeForm === edit
      if(contentArticleEmpty && this.imagesOfArticle.length === 0 &&
        this.docsOfArticle.length === 0 && this.buttonsOfArticle.length === 0){

        this.toastRef.showError('No se puede guardar un artículo vacío', 'Error de validación');
        this.isArticleEmpty = true;
      }else{
        this.isArticleEmpty = false;
      }
    }
  }

}
