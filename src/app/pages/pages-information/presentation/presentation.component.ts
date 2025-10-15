import { Component, inject, OnInit } from '@angular/core';
import { InformationService } from '../../services/information.service';
import { Article } from '../../models/article';

@Component({
  selector: 'app-presentation',
  templateUrl: './presentation.component.html',
  styleUrl: './presentation.component.scss'
})
export class PresentationComponent implements OnInit {
  private readonly informationService = inject(InformationService);

  articles: Article[] = [];

  ngOnInit(): void {
    this.informationService.getAllArticles().subscribe({
      next: (resArticles) => {
        this.articles = resArticles;
        console.log(this.articles);
      }
    });
  }
}
