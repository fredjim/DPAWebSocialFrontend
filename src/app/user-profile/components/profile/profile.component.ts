import { Component ,inject, OnInit } from '@angular/core';
import { PostService } from '../../../posts/services/post.service';
import { UserDetail } from '../../../posts/models/user-detail';
import { Institution } from '../../../posts/models/institution';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../authentication/services/auth.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private readonly postService = inject(PostService);
  private readonly authService = inject(AuthService);

  currentUser!: UserDetail;
  institution!: Institution;
  uuidIntitution = `${environment.INSTITUTION_ID}`;
  authenticated: boolean = false;
  isMobileMenuOpen = false;
  isMenuOpen = false;

  ngOnInit(): void {
    this.authenticated = this.authService.isAuthenticated();
    if(this.authenticated){
      this.postService.getUser().subscribe(user => {
        this.currentUser = user;
        console.log(this.currentUser)
      });
    }

    this.postService.getInstitution(this.uuidIntitution).subscribe(institutionData =>{
      this.institution = institutionData;     
    });
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  logout() {
    this.authService.logout();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu() {
    this.isMobileMenuOpen = false;
  }
}
