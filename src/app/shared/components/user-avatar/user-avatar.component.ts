import { Component, Input } from '@angular/core';
import { UserDetail } from '../../models/user-detail';

@Component({
  selector: 'app-user-avatar',
  templateUrl: './user-avatar.component.html',
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  @Input() user!: UserDetail | null;
  @Input() userImg: string | null = null;
  @Input() size: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' = 'medium';
  @Input() responsive: boolean = false;

  public readonly DEFAULT_AVATAR = 'assets/default-avatar.png';

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (!img.src.includes('default-avatar.png')) {
      img.src = this.DEFAULT_AVATAR;
    }
  }

  formatUserImg(): string | null {
    if(!this.userImg) return null;
    return `https://dpa.umss.edu.bo${this.userImg}`;
  }

}
