import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Institution } from '../../models/institution';

@Component({
  selector: 'app-institution-avatar',
  templateUrl: './institution-avatar.component.html',
  styleUrl: './institution-avatar.component.scss'
})
export class InstitutionAvatarComponent implements OnInit, OnChanges {
  @Input() institution!: Institution;
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' = 'medium';

  imageError = false;

  ngOnInit(): void {
    this.resetImageError();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['institution']) {
      this.resetImageError();
    }
  }

  get hasValidLogo(): boolean {
    return this.hasValidImageUrl(this.institution?.logo_url) && !this.imageError;
  }

  get initials(): string {
    if (!this.institution?.name) {
      return 'IN';
    }

    const words = this.institution.name.trim().split(/\s+/).filter(Boolean);
    if (words.length === 1) {
      return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
  }

  onImageError(): void {
    this.imageError = true;
  }

  private hasValidImageUrl(url: string | null | undefined): boolean {
    return !!url && url.trim().length > 0;
  }

  private resetImageError(): void {
    this.imageError = false;
  }
}
