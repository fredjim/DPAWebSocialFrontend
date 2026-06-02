import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { InformationService } from '../../../pages/services/information.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Section } from '../../../pages/models/section';
import { MessageService } from 'primeng/api';
import moment from 'moment';
import { SectionStateService } from '../../../pages/services/sections-state.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss'
})
export class FormSectionComponent implements OnInit, OnChanges {
  private readonly informationService = inject(InformationService);
  private readonly messageService = inject(MessageService);
  private readonly sectionStateService = inject(SectionStateService);
  private readonly institutionId = environment.INSTITUTION_ID;

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() currentSection: Section | undefined;
  @Input() currentNavItemId!: string | null;
  @Output() onCloseNew = new EventEmitter<boolean>();
  @Output() onCloseEdit = new EventEmitter<void>();
  @Output() onEditedSection = new EventEmitter<Section>();
  @Output() onDeletedSection = new EventEmitter<Section>();
  @Output() onCreateSection = new EventEmitter<Section>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  public isLoading = false;
  public readonly MAX_LENGTH_NAME = 50;

  public formSection = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.maxLength(this.MAX_LENGTH_NAME)])
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
    if(!this.currentNavItemId) return;

    this.isLoading = true;
    const newSection: Omit<Section, 'uuid' | 'user_id' | 'articles'> = {
      nav_item_id: this.currentNavItemId,
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      institution_id: this.institutionId,
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
    this.informationService.deleteSection(this.currentSection.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección eliminada exitosamente' });
        this.onDeletedSection.emit(this.currentSection);
        this.onCloseEdit.emit();
        this.currentSection = undefined;
      },
      error: (err) => {
        this.isLoading = false;
        console.log('error',err)
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
        this.onCloseEdit.emit();
      }
    });
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

  hasErrors(controlName: string, errorType: string) {
    const control = this.formSection.get(controlName);
    return control?.hasError(errorType) && control?.touched;
  }
}
