import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { InformationService } from '../../../pages/services/information.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Section } from '../../../pages/models/section';
import { MessageService } from 'primeng/api';
import moment from 'moment';
import { SectionStateService } from '../../../pages/services/sections-state.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, finalize, map, Observable, of, tap } from 'rxjs';
import { NavItem } from '../../../pages/models/nav-item';

@Component({
  selector: 'app-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss'
})
export class FormSectionComponent implements OnInit, OnChanges {
  private readonly informationService = inject(InformationService);
  private readonly messageService = inject(MessageService);
  private readonly sectionStateService = inject(SectionStateService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() currentSection: Section | undefined;
  @Input() currentNavItem!: NavItem;
  @Output() onCloseNew = new EventEmitter<boolean>();
  @Output() onCloseEdit = new EventEmitter<void>();
  @Output() onEditedSection = new EventEmitter<Section>();
  @Output() onDeletedSection = new EventEmitter<Section>();
  @Output() onCreateSection = new EventEmitter<Section>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  public isLoading = false;

  public formSection = new FormGroup({
    name: new FormControl('', [Validators.required])
  });

  ngOnInit(): void {
    setTimeout(()=>{
      this.focusInputIfNeeded();
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentSection'] && this.currentSection && this.formSection && this.typeForm === 'edit'){
      this.formSection.patchValue({
        name: this.currentSection.name
      })
    }
  }

  onSubmit(): void {
    if(this.typeForm === 'create'){
      this.createSection();
    }else if(this.typeForm === 'edit'){
      this.updateSection();
    }
  }

  private createSection(): void {
    if(!this.currentNavItem) return;

    this.isLoading = true;
    const newSection: Omit<Section, 'uuid' | 'user_id' | 'articles'> = {
      nav_item_id: this.currentNavItem.uuid,
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      institution_id: this.authService.getInstitutionId() ?? '',
      name: this.formSection.value.name?.trim() ?? ''
    }
    
    this.informationService.createSection(newSection).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección creada exitosamente' });
        this.onCreateSection.emit(created);
        this.closeForm();
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al crear sección' });
        this.closeForm();
      }
    })
  }

  private updateSection(): void {
    if(!this.currentSection) return;

    this.isLoading = true;
    const updatedSection: Section = {
      ...this.currentSection,
      name: this.formSection.value.name?.trim() ?? ''
    }

    this.informationService.updateSection(updatedSection).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.sectionStateService.setSectionToEdit(updated);
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección actualizada exitosamente' });
        this.onEditedSection.emit(updated);
        this.closeForm();
      },
      error: (err) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar sección' });
        this.closeForm();
      }
    })
  }

  deleteSection(): void {
    if(!this.currentSection) return;

    this.isLoading = true;
    
    this.informationService.deleteSection(this.currentSection.uuid).pipe(
      tap({
        next: () => this.handleDeleteSuccess(),
        error: (err) => this.handleDeleteError(err)
      }),
      concatMap(() => this.handleRedirectionIfNeeded()),
      finalize(() => this.finalizeDelete())
    ).subscribe();
  }

  private handleDeleteSuccess(): void {
    this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección eliminada exitosamente' });
    this.onDeletedSection.emit(this.currentSection);
    this.onCloseEdit.emit();
  }

  private handleDeleteError(err: any): void {
    console.log('error', err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
    this.onCloseEdit.emit();
  }

  private handleRedirectionIfNeeded(): Observable<void> {
    const currentSectionUrlUuid = this.route.snapshot.firstChild?.paramMap.get('uuidSection');
    
    if (currentSectionUrlUuid && currentSectionUrlUuid === this.currentSection?.uuid) {
      const currentNavItemPath = this.route.snapshot.paramMap.get('pathNavItem');
      
      if (currentNavItemPath && this.currentNavItem) {
        return this.informationService.getAllSectionsByNavItemId(this.currentNavItem.uuid).pipe(
          tap(secs => this.performRedirection(currentNavItemPath, secs)),
          map(() => void 0)
        );
      }
    }
    
    return of(void 0);
  }

  private performRedirection(currentNavItemPath: string, sections: any[]): void {
    if (sections.length > 0) {
      const firstSection = sections[0];
      this.router.navigate(['../' + currentNavItemPath, firstSection.uuid], { relativeTo: this.route });
    } else {
      this.router.navigate(['../' + currentNavItemPath], { relativeTo: this.route });
    }
  }

  private finalizeDelete(): void {
    this.isLoading = false;
    this.currentSection = undefined;
  }

  closeForm(): void {
    this.formSection.reset();
    if(this.typeForm === 'edit'){
      this.currentSection = undefined;
      this.onCloseEdit.emit();
    }else{
      this.onCloseNew.emit(true);
    }
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }
}
