import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, WritableSignal, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-document-uploader',
  templateUrl: './document-uploader.component.html',
  styleUrl: './document-uploader.component.scss'
})
export class DocumentUploaderComponent implements OnChanges {
  @Input() showAreaDoc!: WritableSignal<boolean>;
  @Input() isVisibleModal: boolean = false;
  @Output() closeAreaDocEvent = new EventEmitter<boolean>(); 
  @Output() loadFileDoc = new EventEmitter<File[]>(); 
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  public readonly SIZE = 100;
  private readonly MAX_FILE_SIZE = this.SIZE * 1024 * 1024; // 100MB en bytes
  public isLoadingIcon = false;
  private iconPreloaded = false;
  showPreviewDoc = false;
  fileDocs: File[] = []; // Los docs que se seleccionan para crear post
  typesDocs = {
    pdf : 'application/pdf',
    document : ['application/doc','application/docx','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    presentation: ['application/pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    text : 'application/txt' 
  }
  fileType!: string;
  isHovering = false;

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['isVisibleModal'] && !this.isVisibleModal){
      this.closeCleanPreviewDoc();
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
      event.target.value = '';
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

    this.fileDocs = [...this.fileDocs, ...newFiles];
    this.showPreviewDoc = true;
    this.loadFileDoc.emit(this.fileDocs);
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

    if (this.fileInput?.nativeElement) {
      // Resetear antes de abrir
      this.fileInput.nativeElement.value = '';
      this.fileInput.nativeElement.click();
    }
  }

  removeDoc(index: number) {
    this.fileDocs.splice(index, 1);
    if (this.fileDocs.length === 0) {
      this.showPreviewDoc = false;
    }
    this.loadFileDoc.emit(this.fileDocs);
  }

  closeCleanPreviewDoc(){
    this.fileDocs = [];
    this.showPreviewDoc = false;
    this.showAreaDoc.set(false);
    
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
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
