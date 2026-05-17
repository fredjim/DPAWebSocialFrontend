import { Component, Input } from '@angular/core';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-custom-toast',
  templateUrl: './custom-toast.component.html',
  styleUrls: ['./custom-toast.component.scss']
})
export class CustomToastComponent {
  // Key para identificar este toast específico (útil si hay múltiples en pantalla)
  @Input() key: string = 'customToast';

  // Posición del toast en la pantalla
  @Input() position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center' = 'top-right';

  constructor(private readonly messageService: MessageService) { }

  /**
   * Muestra un mensaje de éxito
   * @param detail Detalle del mensaje
   * @param summary Título del mensaje (opcional)
   * @param life Tiempo visible en ms (opcional)
   */
  showSuccess(detail: string, summary: string = 'Éxito', life: number = 3000): void {
    this.messageService.add({ key: this.key, severity: 'success', summary, detail, life });
  }

  /**
   * Muestra un mensaje de información
   * @param detail Detalle del mensaje
   * @param summary Título del mensaje (opcional)
   * @param life Tiempo visible en ms (opcional)
   */
  showInfo(detail: string, summary: string = 'Información', life: number = 3000): void {
    this.messageService.add({ key: this.key, severity: 'info', summary, detail, life });
  }

  /**
   * Muestra un mensaje de advertencia
   * @param detail Detalle del mensaje
   * @param summary Título del mensaje (opcional)
   * @param life Tiempo visible en ms (opcional)
   */
  showWarn(detail: string, summary: string = 'Advertencia', life: number = 3000): void {
    this.messageService.add({ key: this.key, severity: 'warn', summary, detail, life });
  }

  /**
   * Muestra un mensaje de error
   * @param detail Detalle del mensaje
   * @param summary Título del mensaje (opcional)
   * @param life Tiempo visible en ms (opcional)
   */
  showError(detail: string, summary: string = 'Error', life: number = 3000): void {
    this.messageService.add({ key: this.key, severity: 'error', summary, detail, life });
  }

  /**
   * Limpia todos los mensajes asociados a este toast
   */
  clear(): void {
    this.messageService.clear(this.key);
  }
}
