import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Article } from '../models/article';
import { InformationService } from '../services/information.service';
import { MessageService } from 'primeng/api';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { concatMap } from 'rxjs';
import { PostService } from '../../posts/services/post.service';
import { UploadedMedia } from '../../posts/models/uploaded-media';
import { MediaArticle } from '../models/media-article';
import { Link } from '../models/link';

@Component({
  selector: 'app-edit-info',
  templateUrl: './edit-info.component.html',
  styleUrl: './edit-info.component.scss'
})
export class EditInfoComponent implements OnInit, OnChanges {
  private readonly messageService = inject(MessageService);
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
  @ViewChild('fileInput') fileInput!: ElementRef;
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  public imgsPreview: {name: string, type: string, url: string}[] = [];
  public imagesOfArticle: MediaArticle[] = []; // imagenes del articulo actual para renderizar
  private imageFilesToCreate: File[] = []; //imagenes para subir al articulo
  private imagesToDelete: MediaArticle[] = []; //imagenes del articulo para eliminar
  
  public isLoading = false;

  public formArticle = new FormGroup({
    title: new FormControl(''),
    text: new FormControl(''),
  });

  public buttonsOfArticle: Link[] = [];
  public buttonsToDelete: Link[]= [];
  public buttonsToAdd: { name: string, url: string }[] = []; // Para crear articulo
  // Modal de agregar botones
  public visibleModalAddButton = false;

  private modeEdit: 'load' | 'preload' = 'load'; // Modo de edicion de un boton ya guardado en BD o uno pre cargado 
  private indexButton: undefined | number;
  public typeModalButton: 'create' | 'edit' = 'create'; //Tipo de modal de para un boton


  public formNewButton = new FormGroup({
    name: new FormControl('', [Validators.required]),
    url: new FormControl('', [Validators.required])
  });

  constructor(
    private readonly informationService: InformationService,
  ){}

  ngOnInit(): void {
    setTimeout(() => {
      this.onComponentReady.emit();
      this.focusInputIfNeeded();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentArticle'] && this.currentArticle && this.formArticle && this.typeForm === 'edit'){
      this.formArticle.patchValue({
        title: this.currentArticle.title,
        text: this.currentArticle.text
      })
      this.imagesOfArticle = [...this.currentArticle.medias];
      this.buttonsOfArticle = structuredClone(this.currentArticle.links);
    }
  }

  public onSubmit(): void {
    if(this.typeForm === 'edit'){
      this.updatedArticle();
    }else if(this.typeForm === 'create'){
      this.createArticle();
    }
  }

  private createArticle(): void {
    if(this.imageFilesToCreate.length > 0){
      this.isLoading = true;
      const formData = new FormData();
      for (const file of this.imageFilesToCreate){
        if(file.type.includes('image')){
          formData.append('images', file);
        }
      }
  
      this.postService.uploadImages(formData).pipe(
        concatMap((uploadResponse: UploadedMedia[]) => {
          const mediasToArticle: MediaArticle[] = uploadResponse.map((media, index)=> ({
            uuid: media.uuid,
            number: index + 1,
            name: media.name,
            type: media.type,
            path: media.urlResource
          }));
  
          const newArticle: Omit<Article, 'uuid' | 'user_id' | 'links'> & {links: Array<Omit<Link, 'uuid'>> }  = {
            section_id: this.currentSectionUuid,
            date: '',
            title: this.formArticle.value.title ?? '',
            text: this.formArticle.value.text ?? '',
            medias: mediasToArticle,
            links: this.buttonsToAdd
          }
          return this.informationService.createArticle(newArticle);
        })
      ).subscribe({
        next: (articleCreated: Article)=>{
          this.isLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Artículo creado exitosamente' });
          this.onCreateArticle.emit(articleCreated);
          this.closeEdit();
        },
        error: (err) =>{
          this.isLoading = false;
          console.log('Error al crear articulo con imagen', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear artículo' });
          this.closeEdit();
        }
      });
    }else{
      this.isLoading = true;
      const newArticle: Omit<Article, 'uuid' | 'user_id' | 'links'> & {links: Array<Omit<Link, 'uuid'>> } = {
        section_id: this.currentSectionUuid,
        date: '',
        title: this.formArticle.value.title ?? '',
        text: this.formArticle.value.text ?? '',
        medias: [],
        links: this.buttonsToAdd
      }
      
      this.informationService.createArticle(newArticle).subscribe({
        next: (created) => {
          this.isLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Artículo creado exitosamente' });
          this.onCreateArticle.emit(created);
          this.closeEdit();
        },
        error: (err) => {
          this.isLoading = false;
          console.log('Error al crear articulo', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear artículo' });
          this.closeEdit();
        }
      })
    }
  }

  private updatedArticle(): void {
    if(!this.currentArticle) return;

    if(this.imageFilesToCreate.length > 0){
      this.isLoading = true;
      const formData = new FormData();
      for (const file of this.imageFilesToCreate){
        if(file.type.includes('image')){
          formData.append('images', file);
        }
      }
  
      this.postService.uploadImages(formData).pipe(
        concatMap((uploadResponse: UploadedMedia[]) => {
          const mediasToArticle: MediaArticle[] = uploadResponse.map((media, index)=> ({
            uuid: media.uuid,
            number: index + 1,
            name: media.name,
            type: media.type,
            path: media.urlResource
          }));
  
          const articleUpdated: any  = {
            ...this.currentArticle,
            title: this.formArticle.value.title ?? '',
            text: this.formArticle.value.text ?? '',
            medias: [...this.imagesOfArticle,...mediasToArticle],
            links: [...this.buttonsOfArticle, ...this.buttonsToAdd]
          }
          return this.informationService.updateArticle(this.currentArticle!.uuid, articleUpdated);
        })
      ).subscribe({
        next: (articleUpdated: Article)=>{
          this.isLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo editado exitosamente' });
          this.onEditedArticle.emit(articleUpdated);
          this.closeEdit();
        },
        error: (err) =>{
          this.isLoading = false;
          console.log('Error al actualizar imagenes', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al editar artículo' });
          this.closeEdit();
        }
      });
    }else{
      this.isLoading = true;
      const articleEdited: any = {
        ...this.currentArticle,
        title: this.formArticle.value.title ?? '',
        text: this.formArticle.value.text ?? '',
        medias: [...this.imagesOfArticle],
        links: [...this.buttonsOfArticle, ...this.buttonsToAdd]
      }
      
      this.informationService.updateArticle(this.currentArticle.uuid, articleEdited).subscribe({
        next: (edited) => {
          this.isLoading = false;
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo editado exitosamente' });
          this.onEditedArticle.emit(edited);
          this.closeEdit();
        },
        error: (err) => {
          this.isLoading = false;
          console.log('Error al editar articulo', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al editar artículo' });
          this.closeEdit();
        }
      })
    }
  }

  public closeEdit(): void {
    this.clearImagesPreview();
    this.imageFilesToCreate = [];
    this.imagesToDelete = [];
    if(this.typeForm === 'edit'){
      this.buttonsOfArticle = [];
      this.currentArticle = undefined;
      this.resetFileInput();
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

  public deleteArticle(): void {
    if(!this.currentArticle) return;

    this.isLoading = true;
    this.informationService.deleteArticle(this.currentArticle.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo eliminado exitosamente' });
        this.onDeletedArticle.emit(this.currentArticle);
        this.onCloseEdit.emit();
        this.currentArticle = undefined;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar artículo' });
        this.onCloseEdit.emit();
      }
    });
  }

  public openInputFileMedia(): void {
    this.resetFileInput();
    this.fileInput?.nativeElement.click();  
  }

  private resetFileInput(): void {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  changeInputMedia(event: Event){
    if (event.target instanceof HTMLInputElement && event.target.files){
      this.imageFilesToCreate = Array.from(event.target.files);

      // Validaciones
      if(!this.isValidFileType(this.imageFilesToCreate)){
        alert('Por favor, seleccione solo imágenes');
        this.resetFileInput();
        return;
      }

      const newsPreviews = this.imageFilesToCreate.map(file => ({name: file.name, type: file.type, url: URL.createObjectURL(file)}));
      this.imgsPreview.push(...newsPreviews);
      
    }
  }

  private isValidFileType(files: File[]): boolean {
    return files.every(file => {
      const fileType = file.type;
      return fileType.startsWith('image/');
    });
  }

  selectImageDeleteOfArticle(index: number, image: MediaArticle): void {
    this.imagesToDelete.push(image);
    this.imagesOfArticle.splice(index, 1);
  }

  deleteImagePreview(index: number): void {
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
  public deleteButton(button: Link, index: number): void {
    this.buttonsToDelete.push(button);
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
      const buttonToDelete = this.buttonsOfArticle[this.indexButton];
      this.buttonsOfArticle.splice(this.indexButton,1);
      this.buttonsToDelete.push(buttonToDelete);

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
}
