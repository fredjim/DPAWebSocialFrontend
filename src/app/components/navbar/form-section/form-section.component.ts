import { Component, ElementRef, EventEmitter, inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { InformationService } from '../../../pages/services/information.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Section } from '../../../pages/models/section';
import { MessageService } from 'primeng/api';
import moment from 'moment';

@Component({
  selector: 'app-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss'
})
export class FormSectionComponent implements OnInit {
  private readonly informationService = inject(InformationService);
  private readonly messageService = inject(MessageService);

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() currentSection: Section | undefined;
  @Output() onCloseNew = new EventEmitter<boolean>();
  @Output() onCloseEdit = new EventEmitter<void>();
  @Output() onEditedSectioin = new EventEmitter<Section>();
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

  onSubmit(): void {
    if(this.typeForm === 'create'){
      this.createSection();
    }
  }

  private createSection(): void {
    this.isLoading = true;
    const newSection: Omit<Section, 'uuid' | 'user_id' | 'articles'> = {
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      institution_id: '93j203b4-f63b-4c4a-be05-eae84cef0c0c',
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

  deleteSection(): void {
    if(!this.currentSection) return;

    this.isLoading = true;
    this.informationService.deleteArticle(this.currentSection.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección eliminada exitosamente' });
        this.onDeletedSection.emit(this.currentSection);
        this.onCloseEdit.emit();
        this.currentSection = undefined;
      },
      error: () => {
        this.isLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
        this.onCloseEdit.emit();
      }
    });
  }

  closeForm(): void {
    this.formSection.reset();
    if(this.typeForm === 'edit'){
      this.currentSection = undefined;
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
