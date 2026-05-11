import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output
} from '@angular/core';
import {
  ButtonSeverity,
  ButtonSize,
  ButtonType,
  ButtonVariant
} from './ui-button.types';

/**
 * UiButtonComponent — Design-system button abstraction.
 *
 * WHY wrap PrimeNG instead of using <p-button> directly:
 *   1. Decoupling: if PrimeNG is upgraded or replaced, only this file changes.
 *   2. Enforcement: teams can't bypass design-system tokens by accident.
 *   3. Composability: ng-content allows rich label content.
 *   4. Centralized loading / disabled logic shared across the whole app.
 *
 * Renders a native <button> with the pRipple directive — not <p-button>.
 * This gives full ownership of the DOM structure and avoids style-override fights.
 */
@Component({
  selector: 'ui-button',
  templateUrl: './ui-button.component.html',
  styleUrls: ['./ui-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiButtonComponent {

  // ── Inputs ─────────────────────────────────────────────────────────────────

  /** Text label. When omitted, use ng-content for custom markup. */
  @Input() label?: string;

  /**
   * PrimeIcons class string (e.g. 'pi pi-check').
   * Displayed before the label; hidden during loading to avoid double spinner.
   */
  @Input() icon?: string;

  /** Color intent. Defaults to 'primary'. */
  @Input() severity: ButtonSeverity = 'primary';

  /** Rendering style. Defaults to 'filled'. */
  @Input() variant: ButtonVariant = 'filled';

  /** Size scale. Defaults to 'md'. */
  @Input() size: ButtonSize = 'md';

  /** Native button type — critical for form submit behavior. */
  @Input() type: ButtonType = 'button';

  /** Replaces the icon with a spinner and suppresses the click event. */
  @Input() loading = false;

  /** Disables the button visually and functionally. */
  @Input() disabled = false;

  /** Full pill / circle border-radius. */
  @Input() rounded = false;

  /** Makes the host element block-level so the button fills its container. */
  @Input() fullWidth = false;

  /** Passed as data-bs-dismiss on the inner <button> so Bootstrap can handle modal/offcanvas dismissal natively. */
  @Input() bsDismiss?: string;

  // ── Output ─────────────────────────────────────────────────────────────────

  /**
   * Named 'clicked' instead of 'click' to avoid shadowing the native DOM event
   * and to prevent accidental double-firing in parent templates.
   */
  @Output() clicked = new EventEmitter<MouseEvent>();

  // ── Host bindings ──────────────────────────────────────────────────────────

  @HostBinding('style.display')
  get hostDisplay(): string {
    return this.fullWidth ? 'block' : 'inline-block';
  }

  // ── Computed properties ────────────────────────────────────────────────────

  get cssClasses(): Record<string, boolean> {
    return {
      [`ui-btn--${this.severity}`]: true,
      [`ui-btn--${this.variant}`]:  true,
      [`ui-btn--${this.size}`]:     true,
      'ui-btn--rounded':    this.rounded,
      'ui-btn--loading':    this.loading,
      'ui-btn--disabled':   this.disabled || this.loading
    };
  }

  get isDisabled(): boolean {
    return this.disabled || this.loading;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  handleClick(event: MouseEvent): void {
    if (this.isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
