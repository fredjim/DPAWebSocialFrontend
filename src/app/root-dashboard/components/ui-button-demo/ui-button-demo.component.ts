import { Component } from '@angular/core';
import { ButtonSeverity, ButtonSize, ButtonVariant } from '../../../shared/components/ui-button/ui-button.types';

@Component({
  selector: 'app-ui-button-demo',
  templateUrl: './ui-button-demo.component.html',
  styleUrls: ['./ui-button-demo.component.scss']
})
export class UiButtonDemoComponent {

  readonly severities: ButtonSeverity[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info'];
  readonly variants: ButtonVariant[]    = ['filled', 'outlined', 'text'];
  readonly sizes: ButtonSize[]          = ['sm', 'md', 'lg'];

  // Interactive playground state
  playLoading  = false;
  playDisabled = false;
  playRounded  = false;
  playSeverity: ButtonSeverity = 'primary';
  playVariant: ButtonVariant   = 'filled';
  playSize: ButtonSize         = 'md';
  clickCount = 0;

  onClicked(): void {
    this.clickCount++;
  }

  toggleLoading(): void {
    this.playLoading = !this.playLoading;
  }

  toggleDisabled(): void {
    this.playDisabled = !this.playDisabled;
  }

  toggleRounded(): void {
    this.playRounded = !this.playRounded;
  }
}
