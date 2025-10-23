import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Article } from '../models/article';
import { InformationService } from '../services/information.service';
import { MessageService } from 'primeng/api';
import { FormControl, FormGroup } from '@angular/forms';
import { concatMap } from 'rxjs';
import { PostService } from '../../posts/services/post.service';
import { UploadedMedia } from '../../posts/models/uploaded-media';
import { MediaArticle } from '../models/media-article';

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

  imgsPreview: {name: string, type: string, url: string}[] = [];
  imageFiles: File[] = [];

  public formArticle = new FormGroup({
    title: new FormControl(''),
    text: new FormControl(''),
  });

  constructor(
    private readonly informationService: InformationService,
  ){}

  ngOnInit(): void {
    setTimeout(() => {
      this.onComponentReady.emit();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentArticle'] && this.currentArticle && this.formArticle && this.typeForm === 'edit'){
      this.formArticle.patchValue({
        title: this.currentArticle.title,
        text: this.currentArticle.text
      })
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
    if(this.imageFiles.length > 0){
      const formData = new FormData();
      for (const file of this.imageFiles){
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
  
          const newArticle: Omit<Article, 'uuid' | 'user_id'>  = {
            section_id: this.currentSectionUuid,
            date: '',
            title: this.formArticle.value.title ?? '',
            text: this.formArticle.value.text ?? '',
            medias: mediasToArticle
          }
          return this.informationService.createArticle(newArticle);
        })
      ).subscribe({
        next: (articleCreated: Article)=>{
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Artículo creado exitosamente' });
          this.onCreateArticle.emit(articleCreated);
          this.closeEdit();
        },
        error: (err) =>{
          console.log('Error al creat articulo', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear artículo' });
          this.closeEdit();
        }
      });
    }else{
      const newArticle: Omit<Article, 'uuid' | 'user_id'> = {
        section_id: this.currentSectionUuid,
        date: '',
        title: this.formArticle.value.title ?? '',
        text: this.formArticle.value.text ?? '',
        medias: []
      }
      
      this.informationService.createArticle(newArticle).subscribe({
        next: (created) => {
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Artículo creado exitosamente' });
          this.onCreateArticle.emit(created);
          this.closeEdit();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear artículo' });
          this.closeEdit();
        }
      })
    }
  }

  private updatedArticle(): void {
    if(!this.currentArticle) return;

    if(this.imageFiles.length > 0){
      const formData = new FormData();
      for (const file of this.imageFiles){
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
            medias: mediasToArticle
          }
          return this.informationService.updateArticle(this.currentArticle!.uuid, articleUpdated);
        })
      ).subscribe({
        next: (articleUpdated: Article)=>{
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo editado exitosamente' });
          articleUpdated.medias = [...this.currentArticle!.medias, ...articleUpdated.medias];
          this.onEditedArticle.emit(articleUpdated);
          this.closeEdit();
        },
        error: (err) =>{
          console.log('Error al actualizar imagenes', err);
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al editar artículo' });
          this.closeEdit();
        }
      });
    }else{
      const articleEdited: Omit<Article, 'uuid' | 'user_id'> = {
        ...this.currentArticle,
        title: this.formArticle.value.title ?? '',
        text: this.formArticle.value.text ?? '',
        medias: this.currentArticle.medias
      }
      
      this.informationService.updateArticle(this.currentArticle.uuid, articleEdited).subscribe({
        next: (edited) => {
          this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo editado exitosamente' });
          this.onEditedArticle.emit(edited);
          this.closeEdit();
        },
        error: () => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al editar artículo' });
          this.closeEdit();
        }
      })
    }
  }

  public closeEdit(): void {
    this.clearImagesPreview();
    if(this.typeForm === 'edit'){
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

    this.informationService.deleteArticle(this.currentArticle.uuid).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Articulo eliminado exitosamente' });
        this.onDeletedArticle.emit(this.currentArticle);
        this.onCloseEdit.emit();
        this.currentArticle = undefined;
      },
      error: () => {
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
      this.imageFiles = Array.from(event.target.files);

      // Validaciones
      if(!this.isValidFileType(this.imageFiles)){
        alert('Por favor, seleccione solo imágenes');
        this.resetFileInput();
        return;
      }

      const newsPreviews = this.imageFiles.map(file => ({name: file.name, type: file.type, url: URL.createObjectURL(file)}));
      this.imgsPreview.push(...newsPreviews);
      
    }
  }

  private isValidFileType(files: File[]): boolean {
    return files.every(file => {
      const fileType = file.type;
      return fileType.startsWith('image/');
    });
  }
}
