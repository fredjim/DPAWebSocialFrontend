import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { debounceTime, distinctUntilChanged, fromEvent, map, Subscription } from 'rxjs';
import { buildLinkedHtml } from '../../../../shared/utils/url.utils';

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
  @ViewChild('editorRef', { static: true }) editor!: ElementRef<HTMLDivElement>;

  private readonly subscription = new Subscription();
  private isComposing = false;

  currentLength: number = 0;
  isExceeded: boolean = false;
  private currentValue: string = '';

  ngOnInit(): void {
    if (this.contentText && this.editor) {
      this.editor.nativeElement.innerHTML = buildLinkedHtml(this.contentText);
      this.currentValue = this.contentText;
      this.currentLength = this.contentText.length;
      this.isExceeded = this.contentText.length > this.maxLength;
    }
    this.updateEmptyState();
  }

  ngAfterViewInit(): void {
    this.setupListeners();
  }

  private setupListeners(): void {
    const el = this.editor.nativeElement;
    const input$ = fromEvent(el, 'input');

    // Inmediato: trunca por maxLength y actualiza contador en cada tecla
    this.subscription.add(
      input$.subscribe(() => this.handleInput())
    );

    // Debounced: reconstruye los links después de que el usuario deja de escribir
    this.subscription.add(
      input$.pipe(
        debounceTime(500),
        map(() => el.textContent ?? ''),
        distinctUntilChanged()
      ).subscribe(text => {
        if (this.isComposing) return;
        this.relinkContent(text);
        this.currentValue = text;
        this.currentLength = Math.min(text.length, this.maxLength);
        this.textChangeEvent.emit(this.currentValue);
      })
    );

    // Composición IME
    this.subscription.add(
      fromEvent(el, 'compositionstart').subscribe(() => (this.isComposing = true))
    );
    this.subscription.add(
      fromEvent(el, 'compositionend').subscribe(() => {
        this.isComposing = false;
        this.handleInput();
      })
    );

    // Pegar solo texto plano
    this.subscription.add(
      fromEvent<ClipboardEvent>(el, 'paste').subscribe(event => this.handlePaste(event))
    );

    // Enter -> salto de línea plano
    this.subscription.add(
      fromEvent<KeyboardEvent>(el, 'keydown').subscribe(event => this.handleKeydown(event))
    );

    // Clic sobre un link -> abrir en nueva pestaña
    this.subscription.add(
      fromEvent<MouseEvent>(el, 'click').subscribe(event => this.handleClick(event))
    );
  }

  private handleInput(): void {
    if (this.isComposing) return;

    const el = this.editor.nativeElement;
    const text = el.textContent ?? '';

    if (text.length > this.maxLength) {
      this.truncateContent();
      this.isExceeded = true;
      this.currentLength = this.maxLength;
      this.currentValue = el.textContent ?? '';
      this.textChangeEvent.emit(this.currentValue);
    } else {
      this.isExceeded = false;
      this.currentLength = text.length;
      this.currentValue = text;
      this.textChangeEvent.emit(text);
    }

    this.updateEmptyState();
  }

  private handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      document.execCommand('insertText', false, '\n');
    }
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const anchor = target.closest('a');
    if (!anchor) return;

    event.preventDefault();
    const href = anchor.getAttribute('href');
    if (!href) return;

    if (href.startsWith('mailto:')) {
      window.location.href = href;
    } else {
      window.open(href, '_blank', 'noopener,noreferrer');
    }
  }

  private relinkContent(text: string): void {
    const el = this.editor.nativeElement;
    const caretOffset = this.getCaretOffset();

    el.innerHTML = buildLinkedHtml(text);

    this.setCaretOffset(Math.min(caretOffset, text.length));
    this.updateEmptyState();
  }

  private truncateContent(): void {
    const el = this.editor.nativeElement;
    const text = el.textContent ?? '';
    const caretOffset = Math.min(this.getCaretOffset(), this.maxLength);

    el.textContent = text.substring(0, this.maxLength);
    this.setCaretOffset(caretOffset);
  }

  private updateEmptyState(): void {
    const el = this.editor.nativeElement;
    const isEmpty = (el.textContent ?? '').length === 0;
    el.classList.toggle('empty', isEmpty);
  }

  // --- Utilidades de posición de cursor (Range/Selection) ---

  private getCaretOffset(): number {
    const el = this.editor.nativeElement;
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return 0;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(el);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    return preCaretRange.toString().length;
  }

  private setCaretOffset(offset: number): void {
    const el = this.editor.nativeElement;
    const selection = window.getSelection();
    if (!selection) return;

    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let remaining = offset;
    let targetNode: Node | null = null;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const len = node.textContent?.length ?? 0;
      if (remaining <= len) {
        targetNode = node;
        break;
      }
      remaining -= len;
    }

    const range = document.createRange();
    if (targetNode) {
      range.setStart(targetNode, remaining);
    } else {
      range.selectNodeContents(el);
      range.collapse(false);
    }
    range.collapse(true);

    selection.removeAllRanges();
    selection.addRange(range);
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
