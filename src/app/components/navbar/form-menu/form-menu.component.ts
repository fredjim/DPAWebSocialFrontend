import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Menu } from '../../../pages/models/menu';
import { InformationService } from '../../../pages/services/information.service';
import moment from 'moment';

@Component({
  selector: 'app-form-menu',
  templateUrl: './form-menu.component.html',
  styleUrl: './form-menu.component.scss'
})
export class FormMenuComponent implements OnChanges {
  private readonly informationService = inject(InformationService);

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() visibleModal = false;
  @Input() currentMenu: Menu | undefined;
  @Output() onCreateMenu = new EventEmitter<{menu?: Menu, error?: any}>();
  @Output() onEditedMenu = new EventEmitter<{menu?: Menu, error?: any}>();
  @Output() onDeletedMenu = new EventEmitter<{menu?: Menu, error?: any}>();
  @Output() modalClosed = new EventEmitter<boolean>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  isLoading = false;

  public formMenu = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2),Validators.maxLength(50)])
  });

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['visibleModal'] && this.visibleModal){
      this.focusInputIfNeeded();
    }
    if(changes['currentMenu'] && this.currentMenu && this.formMenu && this.typeForm === 'edit'){
      this.formMenu.patchValue({
        name: this.currentMenu.name
      })
    }
  }

  onSubmit() {
    if(this.typeForm === 'create'){
      console.log('create')
      this.createMenu();
    }else if(this.typeForm === 'edit'){
      console.log('edit')
      this.updateMenu();
    }
  }

  private createMenu() {
    this.isLoading = true;
    const newMenu: Omit<Menu, 'uuid' | 'user_id' | 'sections'> = {
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      institution_id: '93j203b4-f63b-4c4a-be05-eae84cef0c0c',
      name: this.formMenu.get('name')?.value ?? ''
    }

    this.informationService.createMenu(newMenu).subscribe({
      next:(created) => {
        this.isLoading = false;
        this.onCreateMenu.emit({menu: created});
        this.onCloseModal();
      },
      error: (error) => {
        this.isLoading = false;
        this.onCreateMenu.emit({error});
      }
    });
  }

  private updateMenu(): void {
    if(!this.currentMenu) return;

    this.isLoading = true;
    const updatedMenu: Menu = {
      ...this.currentMenu,
      name: this.formMenu.value.name?.trim() ?? ''
    }

    this.informationService.updateMenu(updatedMenu).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.onEditedMenu.emit({menu: updated});
        
      },
      error: (error) => {
        this.isLoading = false;
        this.onEditedMenu.emit({error});
      }
    })
  }

  deleteMenu(): void {
    if(!this.currentMenu) return;

    this.isLoading = true;
    this.informationService.deleteMenu(this.currentMenu.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.onDeletedMenu.emit({menu: this.currentMenu});
        this.currentMenu = undefined;
      },
      error: (error) => {
        this.isLoading = false;
        console.log('error',error)
        this.onDeletedMenu.emit({error});
      }
    });
  }

  onCloseModal() {
    this.modalClosed.emit(false);
    this.formMenu.reset();
    this.currentMenu = undefined;
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }
}
