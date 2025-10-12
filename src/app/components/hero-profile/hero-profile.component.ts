import { Component } from '@angular/core';
import { Institution } from '../../posts/models/institution';
import { PostService } from '../../posts/services/post.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-hero-profile',
  templateUrl: './hero-profile.component.html',
  styleUrl: './hero-profile.component.scss'
})
export class HeroProfileComponent {

	uuidIntitutionDric = `${environment.INSTITUTION_ID}`;

	institution!: Institution;

	constructor(private postService: PostService) {
	}

	ngOnInit() {
		this.getInstitutionData(this.uuidIntitutionDric);
	}

	getInstitutionData(uuid: string) {
		this.postService.getInstitution(uuid).subscribe({
			next: (dataInstitution: Institution) => {
				this.institution = dataInstitution;
			},
			error(error) {
				console.log(error)
			}
		})
	}
  
}
