import { Component, EventEmitter, Output, ViewChild, ElementRef, Input, OnChanges, SimpleChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-text-editor',
  templateUrl: './text-editor.component.html',
  styleUrl: './text-editor.component.scss'
})
export class TextEditorComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Output() textChangeEvent = new EventEmitter<string>();
  @ViewChild('textareaRef') textarea!: ElementRef<HTMLTextAreaElement>;
  @Input() isVisibleModal: boolean = false;
  @Input() maxLength: number = 1200;

  currentLength: number = 0;
  isExceeded: boolean = false;

  private readonly subscription = new Subscription();
  private shouldClearTextarea = false;
  private currentValue: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['isVisibleModal'] && !this.isVisibleModal){
      // Marcar que debemos limpiar el textarea cuando esté disponible
      this.shouldClearTextarea = true;
      
      // Si el textarea ya está disponible, limpiarlo de inmediato
      if (this.textarea) {
        this.clearTextarea();
      }
    }
  }
  
  ngAfterViewInit(): void {
    this.setupObservable();

    // Si se ha marcado para limpiar y ahora el textarea está disponible
    if (this.shouldClearTextarea && this.textarea) {
      this.clearTextarea();
    }
  }

  private setupObservable(): void {
    const textAreaInput$ = fromEvent(this.textarea.nativeElement, 'input').pipe(
      debounceTime(500),
      distinctUntilChanged(),
      map((event: Event) => (event.target as HTMLTextAreaElement).value),
      // Cortar el texto si excede el límite (prevención)
      map(value => {
        if (value.length >= this.maxLength) {
          this.isExceeded = true;
          return value.substring(0, this.maxLength);
        }
        this.isExceeded = false;
        return value;
      })
    );
    
    this.subscription.add(
      textAreaInput$.subscribe(controlledValue => {
        // Si se recortó el valor, actualizar el textarea
        if (controlledValue !== this.textarea.nativeElement.value) {
          this.textarea.nativeElement.value = controlledValue;
        }
        
        this.currentValue = controlledValue;
        this.currentLength = controlledValue.length;
        this.textChangeEvent.emit(controlledValue);
      })
    );
  }

  // Método manual para control en tiempo real y evitar excesos rápidos
  onManualInput(event: Event): void {
    const rawValue = (event.target as HTMLTextAreaElement).value;
    
    if (rawValue.length > this.maxLength) {
      // Cortar inmediatamente para evitar que el usuario siga escribiendo
      const truncated = rawValue.substring(0, this.maxLength);
      this.textarea.nativeElement.value = truncated;
      this.isExceeded = true;
      this.currentLength = this.maxLength;
      this.currentValue = truncated;
      this.textChangeEvent.emit(truncated);
    } else {
      this.isExceeded = false;
      this.currentLength = rawValue.length;
      this.currentValue = rawValue;
      // No emitimos aquí para no duplicar con el observable
    }
    
    this.adjustTextAreaHeight();
  }
  
  private clearTextarea(): void {
    if(this.textarea){
      this.textarea.nativeElement.value = '';
      this.currentValue = '';
      this.currentLength = 0;
      this.isExceeded = false;
      this.textChangeEvent.emit('');
    }
    this.shouldClearTextarea = false;
    this.resetTextAreaHeight();
  }

  private adjustTextAreaHeight(): void {
    const textareaElement = this.textarea.nativeElement;
    textareaElement.style.height = 'auto'; // Restablece la altura
    textareaElement.style.height = `${textareaElement.scrollHeight}px`; // Ajusta la altura según el contenido
  }

  private resetTextAreaHeight(): void {
    const textareaElement = this.textarea.nativeElement;
    textareaElement.style.height = 'auto'; // Restablece la altura
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
