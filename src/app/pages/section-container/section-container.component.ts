import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { InformationService } from '../services/information.service';
import { Section } from '../models/section';

@Component({
  selector: 'app-section-container',
  templateUrl: './section-container.component.html',
  styleUrl: './section-container.component.scss'
})
export class SectionContainerComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly informationService = inject(InformationService);
  
  currentSection?: Section;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const sectionId = params.get('id');
      if (sectionId) {
        this.loadSection(sectionId);
      }
    });
  }

  private loadSection(uuid: string) {
    this.informationService.getSectionById(uuid).subscribe(section => {
      this.currentSection = section;
    });
  }

}
