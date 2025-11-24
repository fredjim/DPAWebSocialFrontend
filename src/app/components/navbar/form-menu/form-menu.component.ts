import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavItem } from '../../../pages/models/nav-item';
import { InformationService } from '../../../pages/services/information.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-form-menu',
  templateUrl: './form-menu.component.html',
  styleUrl: './form-menu.component.scss'
})
export class FormNavItemComponent implements OnChanges {
  private readonly informationService = inject(InformationService);
  private readonly institutionId = environment.INSTITUTION_ID;

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() visibleModal = false;
  @Input() currentNavItem!: NavItem | null;
  @Input() lengthNavItems!: number;
  @Output() onCreateNavItem = new EventEmitter<{menu?: NavItem, error?: any}>();
  @Output() onEditedNavItem = new EventEmitter<{menu?: NavItem, error?: any}>();
  @Output() onDeletedNavItem = new EventEmitter<{menu?: NavItem | null, error?: any}>();
  @Output() modalClosed = new EventEmitter<boolean>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  isLoading = false;

  public formNavItem = new FormGroup({
    label: new FormControl('', [Validators.required, Validators.minLength(2),Validators.maxLength(50)]) as FormControl<string>
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
      this.createNavItem();
    }else if(this.typeForm === 'edit'){
      this.updateNavItem();
    }
  }

  private createNavItem() {

    this.isLoading = true;
    const newNavItem: Omit<NavItem, 'uuid' | 'user_id' | 'createdDate' | 'lastModifiedDate'> = {
      institution_id: this.institutionId,
      label: this.formNavItem.get('label')!.value.trim(),
      url: this.getUrlFromLabel(this.formNavItem.get('label')!.value),
      visible: true,
      orderIndex: this.lengthNavItems + 1
    }

    this.informationService.createNavItem(newNavItem).subscribe({
      next:(created) => {
        this.isLoading = false;
        this.onCreateNavItem.emit({menu: created});
        this.onCloseModal();
      },
      error: (error) => {
        this.isLoading = false;
        console.log('err', error)
        this.onCreateNavItem.emit({error});
      }
    });
  }

  private updateNavItem(): void {
    if(!this.currentNavItem) return;

    this.isLoading = true;
    const updatedNavItem: NavItem = {
      ...this.currentNavItem,
      label: this.formNavItem.get('label')!.value.trim(),
      url: this.getUrlFromLabel(this.formNavItem.get('label')!.value)
    }

    this.informationService.updateNavItem(updatedNavItem).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.onEditedNavItem.emit({menu: updated});
        this.onCloseModal();
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
        this.onCloseModal();
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
    this.currentNavItem = null;
  }

  getUrlFromLabel(label: string): string {
    return label
      .toLowerCase() // Convertir a minúsculas
      .normalize("NFD") // Reemplazar caracteres con acento por sus equivalentes sin acento
      .replaceAll(/[\u0300-\u036f]/g, "") // Reemplazar espacios, guiones y barras por guiones
      .replaceAll(/[\s/]+/g, '-') // Eliminar caracteres especiales excepto guiones
      .replaceAll(/([^a-z0-9-])/g, '') // Eliminar guiones múltiples consecutivos
      .replaceAll(/-+/g, '-') // Eliminar guiones múltiples consecutivos
      .replaceAll(/(^-+)|(-+$)/g, '');  // Eliminar guiones al inicio y final
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }
}
