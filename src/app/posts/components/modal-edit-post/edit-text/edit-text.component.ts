import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map, Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-text',
  templateUrl: './edit-text.component.html',
  styleUrl: './edit-text.component.scss'
})
export class EditTextComponent implements AfterViewInit, OnDestroy {
  @Input() contentText!: string | undefined;
  @Input() postUuid!: string;
  @Output() textChangeEvent = new EventEmitter<string>();
  @ViewChild('textareaRef') textarea!: ElementRef<HTMLTextAreaElement>;
  private subscription!: Subscription;

  ngAfterViewInit(){
    // Configurar el debounceTime para el textarea
    this.subscription = fromEvent(this.textarea.nativeElement, 'input')
    .pipe(
      map((event: any) => event.target.value),
      debounceTime(500), // Espera 500ms después de la última pulsación
      distinctUntilChanged() // Solo emite si el valor es diferente
    )
    .subscribe(value => {
      // Emitir al padre solo después del debounce
      this.textChangeEvent.emit(value);
    });

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

  onTextChange(event: Event){
    //Ajustar la altura del textarea automáticamente
    this.adjustTextAreaHeight();
  }

  private adjustTextAreaHeight(): void {
    const textareaElement = this.textarea.nativeElement;
    textareaElement.style.height = 'auto'; // Restablece la altura
    textareaElement.style.height = `${textareaElement.scrollHeight}px`; // Ajusta la altura según el contenido
  }

  ngOnDestroy(): void {
    // Limpiar la suscripción para evitar memory leaks
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
