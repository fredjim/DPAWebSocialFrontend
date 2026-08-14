// shared/pipes/linkify.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { buildLinkedHtml } from '../utils/url.utils';

@Pipe({
  name: 'linkify',
})
export class LinkifyPipe implements PipeTransform {
  constructor(private readonly sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const html = buildLinkedHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}