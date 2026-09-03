import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Section } from '../../shared/models/section';

@Injectable({ providedIn: 'root' })
export class SectionStateService {
  private readonly editSectionSource = new BehaviorSubject<Section | null>(null);
  currentSection$ = this.editSectionSource.asObservable();

  setSectionToEdit(section: Section | null): void {
    this.editSectionSource.next(section);
  }

  clearSection() {
    this.editSectionSource.next(null);
  }

  getCurrentSectionValue(): Section | null {
    return this.editSectionSource.getValue();
  }
}