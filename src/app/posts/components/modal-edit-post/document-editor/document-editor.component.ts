import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild, WritableSignal } from '@angular/core';
import { Media } from '../../../../shared/models/media';

@Component({
  selector: 'app-document-editor',
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.scss'
})
export class DocumentEditorComponent implements OnInit {
  @Input() showAreaDoc!: WritableSignal<boolean>;

  @Input() listDocsPost: Media[] = []; //Documentos que se recibe del post
  public fileMediaDocs: Media[] = []; //Los docs del post - not undefined
  public fileNewDocs: File[] = []; //Los docs nuevos que se pueden añadir

  @Output() closeAreaDocEvent = new EventEmitter<boolean>(); 
  @Output() loadNewFileDoc = new EventEmitter<File[]>(); 
  @Output() loadOldDocsRemoved = new EventEmitter<Media[]>(); 

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  public readonly SIZE = 100;
  private readonly MAX_FILE_SIZE = this.SIZE * 1024 * 1024; // 100MB en bytes
  private iconPreloaded = false;
  public isLoadingIcon = false;
  showPreviewDoc = false;
  typesDocs = {
    pdf : 'application/pdf',
    document : ['application/doc','application/docx','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    presentation: ['application/pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    text : 'application/txt' 
  }
  fileType!: string;
  isHovering = false;

  ngOnInit(){
    if(this.listDocsPost && this.listDocsPost.length > 0){
      this.fileMediaDocs = [...this.listDocsPost];
      this.showAreaDoc.set(true);
      this.showPreviewDoc = true;
    }

  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isHovering = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.handleFiles(Array.from(event.dataTransfer.files));
      
      if (this.fileInput?.nativeElement) {
        this.fileInput.nativeElement.value = '';
      }
    }
  }

  changeInputMediaDoc(event: Event){
    event.preventDefault();
    event.stopPropagation();
    
    if(event.target instanceof HTMLInputElement && event.target.files && event.target.files.length > 0){
      this.handleFiles(Array.from(event.target.files));
      
      // Limpiar input file
      event.target.value = '';
    } else {
      console.error('No se seleccionó ningún archivo o el evento no contiene archivos');
    }
  }

  private handleFiles(newFiles: File[]) {
    let hasError = false;

    newFiles.forEach(file => {
      // Validar tipo archivo pdf
      if(!this.isValidFileType(file.type)){
        alert(`Por favor, seleccione un documento tipo PDF. Archivo inválido: ${file.name}`);
        hasError = true;
        return;
      }

      // Validar tamaño de archivo
      if(!this.isValidFileSize(file.size)){
        alert(`El archivo ${file.name} es demasiado grande. Máximo permitido: ${this.SIZE}MB.`);
        hasError = true;
        return;
      }
    });

    if(hasError) {
      return;
    }

    // Si el icono no está precargado, precargarlo
    if (!this.iconPreloaded) {
      this.preloadIcon();
    }

    this.fileNewDocs = [...this.fileNewDocs, ...newFiles];
    
    this.showPreviewDoc = true;      
    this.loadNewFileDoc.emit(this.fileNewDocs);
  }

  removeNewDoc(index: number) {
    this.fileNewDocs.splice(index, 1);
    this.checkPreviewState();
    this.loadNewFileDoc.emit(this.fileNewDocs);
  }

  // Se envian los docs eliminados 
  removeExistingDoc(index: number) {
    let listRemoved = this.fileMediaDocs.splice(index, 1);
    this.checkPreviewState();
    this.loadOldDocsRemoved.emit(listRemoved);
  }

  checkPreviewState() {
    if (this.fileNewDocs.length === 0 && this.fileMediaDocs.length === 0) {
      this.showPreviewDoc = false;
    }
  }

  private isValidFileType(type: string): boolean {
    return type.includes('pdf');
  }

  private isValidFileSize(size: number): boolean {
    return size <= this.MAX_FILE_SIZE;
  }

  getTypeFile(type: string){
    if(type === this.typesDocs.pdf)
      return 'File PDF'
    else if(this.typesDocs.document.includes(type))
      return 'File DOCUMENTO'
    else if(this.typesDocs.presentation.includes(type))
      return 'File PRESENTACION'
    else
      return 'File PDF'
  }

  openInputFileDoc(event?: Event){
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Usar ViewChild para acceder al input
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    } else {
      console.error('No se pudo encontrar el elemento de entrada de archivo');
    }
  }

  closeCleanPreviewDoc(){
    this.fileNewDocs = [];
    this.fileMediaDocs = [];
    this.showPreviewDoc = false;
    this.showAreaDoc.set(false);
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
    
    this.loadNewFileDoc.emit(this.fileNewDocs);
    this.loadOldDocsRemoved.emit(this.listDocsPost); // Enviar todos los docs para removerlos
    this.closeAreaDocEvent.emit(this.showAreaDoc());
  }

  private preloadIcon() {
    this.isLoadingIcon = true;
    
    const img = new Image();
    img.onload = () => {
      // La imagen ya está en caché del navegador
      this.iconPreloaded = true;
      this.isLoadingIcon = false;
    };
    img.onerror = () => {
      this.isLoadingIcon = false;
      console.error('Error cargando el icono');
    };
    img.src = '/assets/icon-pdf.png';
  }
}
