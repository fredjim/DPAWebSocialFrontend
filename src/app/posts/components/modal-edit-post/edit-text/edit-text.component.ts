import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-text',
  templateUrl: './edit-text.component.html',
  styleUrl: './edit-text.component.scss'
})
export class EditTextComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() contentText!: string | undefined;
  @Input() postUuid!: string;
  @Input() maxLength: number = 1200;
  @Output() textChangeEvent = new EventEmitter<string>();
  @ViewChild('textareaRef', { static: true }) textarea!: ElementRef<HTMLTextAreaElement>;
  private readonly subscription = new Subscription();

  currentLength: number = 0;
  isExceeded: boolean = false;
  private currentValue: string = '';

  ngOnInit(): void {
    if (this.contentText && this.textarea) {
      this.textarea.nativeElement.value = this.contentText;
      // this.adjustTextAreaHeight();
      this.currentValue = this.contentText;
      this.currentLength = this.contentText.length;
      this.isExceeded = this.contentText.length > this.maxLength;
    }

  }

  ngAfterViewInit(){
    this.setupObservable();

    // Obtén una referencia al modal de Bootstrap
    const modalElement = document.getElementById('edit-'+this.postUuid);
    if (modalElement) {
      // Escucha el evento 'shown.bs.modal'
      modalElement.addEventListener('shown.bs.modal', () => {
        if(modalElement.style.display == 'block')
          this.adjustTextAreaHeight();
      });
    }
  }

  onTextChange(event: Event): void{
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
      this.textChangeEvent.emit(rawValue);
    }

    //Ajustar la altura del textarea automáticamente
    this.adjustTextAreaHeight();
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

  private adjustTextAreaHeight(): void {
    const textareaElement = this.textarea.nativeElement;
    textareaElement.style.height = 'auto'; // Restablece la altura
    textareaElement.style.height = `${textareaElement.scrollHeight}px`; // Ajusta la altura según el contenido
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
