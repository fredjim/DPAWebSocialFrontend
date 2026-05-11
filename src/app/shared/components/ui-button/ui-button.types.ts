// ─────────────────────────────────────────────────────────────────────────────
// UiButton — public type contracts
//
// Exported so any consuming module can import them directly:
//   import { ButtonSeverity } from '@shared/components/ui-button/ui-button.types';
//
// WHY a separate types file:
//   Keeps the component class focused on behavior.
//   Prevents consumers from importing the entire component just to get a type.
// ─────────────────────────────────────────────────────────────────────────────

/** Visual intent of the button — maps to color palette in design system. */
export type ButtonSeverity =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info';

/**
 * Rendering style.
 * - `filled`   → solid background (default)
 * - `outlined` → transparent with colored border
 * - `text`     → no border, no background; color only
 */
export type ButtonVariant = 'filled' | 'outlined' | 'text';

/** T-shirt size — controls padding and font-size. */
export type ButtonSize = 'sm' | 'md' | 'lg';

/** Native HTML button type attribute. */
export type ButtonType = 'button' | 'submit' | 'reset';
