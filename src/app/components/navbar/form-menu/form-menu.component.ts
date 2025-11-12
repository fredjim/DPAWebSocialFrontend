import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavItem } from '../../../pages/models/nav-item';
import { InformationService } from '../../../pages/services/information.service';

@Component({
  selector: 'app-form-menu',
  templateUrl: './form-menu.component.html',
  styleUrl: './form-menu.component.scss'
})
export class FormNavItemComponent implements OnChanges {
  private readonly informationService = inject(InformationService);

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() visibleModal = false;
  @Input() currentNavItem: NavItem | undefined;
  @Output() onCreateNavItem = new EventEmitter<{menu?: NavItem, error?: any}>();
  @Output() onEditedNavItem = new EventEmitter<{menu?: NavItem, error?: any}>();
  @Output() onDeletedNavItem = new EventEmitter<{menu?: NavItem, error?: any}>();
  @Output() modalClosed = new EventEmitter<boolean>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  isLoading = false;

  public formNavItem = new FormGroup({
    label: new FormControl('', [Validators.required, Validators.minLength(2),Validators.maxLength(50)])
  });

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['visibleModal'] && this.visibleModal){
      this.focusInputIfNeeded();
    }
    if(changes['currentNavItem'] && this.currentNavItem && this.formNavItem && this.typeForm === 'edit'){
      this.formNavItem.patchValue({
        label: this.currentNavItem.label
      })
    }
  }

  onSubmit() {
    if(this.typeForm === 'create'){
      console.log('create')
      this.createNavItem();
    }else if(this.typeForm === 'edit'){
      console.log('edit')
      this.updateNavItem();
    }
  }

  private createNavItem() {
    this.isLoading = true;
    const newNavItem: Omit<NavItem, 'uuid' | 'user_id' | 'createdDate' | 'lastModifiedDate'> = {
      institution_id: '93j203b4-f63b-4c4a-be05-eae84cef0c0c',
      label: this.formNavItem.get('name')?.value ?? '',
      url: '',
      visible: true,
      orderIndex: 1
    }

    this.informationService.createNavItem(newNavItem).subscribe({
      next:(created) => {
        this.isLoading = false;
        this.onCreateNavItem.emit({menu: created});
        this.onCloseModal();
      },
      error: (error) => {
        this.isLoading = false;
        this.onCreateNavItem.emit({error});
      }
    });
  }

  private updateNavItem(): void {
    if(!this.currentNavItem) return;

    this.isLoading = true;
    const updatedNavItem: NavItem = {
      ...this.currentNavItem,
      label: this.formNavItem.value.label?.trim() ?? '',
      url: ''
    }

    this.informationService.updateNavItem(updatedNavItem).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.onEditedNavItem.emit({menu: updated});
        
      },
      error: (error) => {
        this.isLoading = false;
        this.onEditedNavItem.emit({error});
      }
    })
  }

  deleteNavItem(): void {
    if(!this.currentNavItem) return;

    this.isLoading = true;
    this.informationService.deleteNavItem(this.currentNavItem.uuid).subscribe({
      next: () => {
        this.isLoading = false;
        this.onDeletedNavItem.emit({menu: this.currentNavItem});
        this.currentNavItem = undefined;
      },
      error: (error) => {
        this.isLoading = false;
        console.log('error',error)
        this.onDeletedNavItem.emit({error});
      }
    });
  }

  onCloseModal() {
    this.modalClosed.emit(false);
    this.formNavItem.reset();
    this.currentNavItem = undefined;
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }
}
