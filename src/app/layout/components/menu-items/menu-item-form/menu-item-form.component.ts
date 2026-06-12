import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NavItem } from '../../../../shared/models/nav-item';
import { NavItemService } from '../../../services/nav-item.service';
import { AuthService } from '../../../../authentication/services/auth.service';
import { debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-menu-item-form',
  templateUrl: './menu-item-form.component.html',
  styleUrl: './menu-item-form.component.scss'
})
export class MenuItemFormComponent implements OnInit, OnChanges, OnDestroy {
  private readonly navItemService = inject(NavItemService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  @Input() typeForm: 'create' | 'edit' = 'create';
  @Input() visibleModal = false;
  @Input() currentNavItem!: NavItem | null;
  @Input() lastOrderIndexNavItems!: number;
  @Output() onCreateNavItem = new EventEmitter<{menus?: NavItem[], error?: any}>();
  @Output() onEditedNavItem = new EventEmitter<{menus?: NavItem[], error?: any}>();
  @Output() onDeletedNavItem = new EventEmitter<{menu?: NavItem | null, error?: any}>();
  @Output() modalClosed = new EventEmitter<boolean>();
  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  public isLoading = false;
  private readonly subscription: Subscription = new Subscription();

  public readonly VALIDATION = {
    LABEL: { MIN: 2, MAX: 50 },
    PATH: { MIN: 2, MAX: 50 },
    ORDER_INDEX: { MIN: 1, MAX: 50 }
  } as const;

  public formNavItem = new FormGroup({
    label: new FormControl('', [Validators.required, Validators.minLength(this.VALIDATION.LABEL.MIN),Validators.maxLength(this.VALIDATION.LABEL.MAX)]) as FormControl<string>,
    path: new FormControl('', [Validators.required, Validators.minLength(this.VALIDATION.PATH.MIN), Validators.maxLength(this.VALIDATION.PATH.MAX)]) as FormControl<string>,
    orderIndex: new FormControl(this.lastOrderIndexNavItems + 1, [Validators.required, Validators.min(this.VALIDATION.ORDER_INDEX.MIN), Validators.max(this.VALIDATION.ORDER_INDEX.MAX)])
  });

  ngOnInit(): void {
    this.formNavItem.patchValue({
      orderIndex: this.lastOrderIndexNavItems + 1
    });

    this.subscription.add(
      this.formNavItem.get('label')?.valueChanges
      .pipe(
        debounceTime(200), // Espera a que deje de escribir
        distinctUntilChanged() // Solo si el valor cambió
      )
      .subscribe(valor => {
        const pathTransformado = this.getPathFromLabelNavItem(valor || '');
        this.formNavItem.get('path')?.setValue(pathTransformado, { emitEvent: false });
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['visibleModal'] && this.visibleModal){
      this.focusInputIfNeeded();
    }
    if(changes['lastOrderIndexNavItems'] && this.lastOrderIndexNavItems){
      this.formNavItem.patchValue({
        orderIndex: this.lastOrderIndexNavItems + 1
      });
    }
    if(changes['currentNavItem'] && this.currentNavItem && this.formNavItem && this.typeForm === 'edit'){
      this.formNavItem.patchValue({
        label: this.currentNavItem.label,
        path: this.currentNavItem.path,
        orderIndex: this.currentNavItem.orderIndex
      })
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
      institution_id: this.authService.getInstitutionId() ?? '',
      label: this.formNavItem.get('label')!.value.trim(),
      path: this.getPathFromLabelNavItem(this.formNavItem.get('path')!.value.trim()),
      visible: true,
      orderIndex: this.formNavItem.get('orderIndex')!.value ?? this.lastOrderIndexNavItems + 1
    }

    this.navItemService.createNavItem(newNavItem).subscribe({
      next:(createdNavs) => {
        this.isLoading = false;
        this.onCreateNavItem.emit({menus: createdNavs});
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
      path: this.getPathFromLabelNavItem(this.formNavItem.get('path')!.value.trim()),
      orderIndex: this.formNavItem.get('orderIndex')!.value ?? this.lastOrderIndexNavItems + 1
    }

    this.navItemService.updateNavItem(updatedNavItem).subscribe({
      next: (updatedNavs) => {
        this.isLoading = false;
        this.onEditedNavItem.emit({menus: updatedNavs});
        this.handleRedirectionAfertEdit(updatedNavs);
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
    this.navItemService.deleteNavItem(this.currentNavItem.uuid).subscribe({
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
    this.formNavItem.reset({
      orderIndex: this.lastOrderIndexNavItems + 1 // mantiene el último valor
    });
    this.currentNavItem = null;
  }

  private handleRedirectionAfertEdit(updatedNavItems: NavItem[]): void {
    const currentNavItemPath = this.route.snapshot.firstChild?.paramMap.get('pathNavItem');
    // Si se edito el NavItem en el que estamos ubicados
    if(currentNavItemPath && currentNavItemPath === this.currentNavItem?.path){
      // Buscar el navItem editado por su uuid
      const navItemUpdated = updatedNavItems.find(navItem => navItem.uuid === this.currentNavItem?.uuid);
      if(navItemUpdated){
        // Actualizar el currentNavItem y redirigir a su ruta actualizada
        this.currentNavItem = navItemUpdated;
        const currentSectionPath = this.route.snapshot.firstChild?.children[0].paramMap.get('pathSection');
        if(currentSectionPath)
          this.router.navigate([navItemUpdated.path, currentSectionPath], { relativeTo: this.route });
        else
          this.router.navigate([navItemUpdated.path], { relativeTo: this.route });
      }
    }
  }

  private getPathFromLabelNavItem(label: string): string {
    if (!label || label.trim().length === 0) {
      return 'untitled';
    }
    
    let path = label
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, '')     // Acentos -> regex
      .replace(/[\\/]/g, '-')              // Barras -> regex
      .replaceAll('.', '-')                // Puntos -> string literal
      .replace(/[<>:"|?*]/g, '')           // Especiales -> regex
      .replaceAll(' ', '-')                // Espacios -> string literal
      .replaceAll('_', '-')                // Guiones bajos -> string literal
      .replace(/[^a-z0-9-]/g, '')          // Resto -> regex
      .replace(/-+/g, '-')                 // Múltiples guiones -> regex
      .replace(/^-+|-+$/g, '');            // Guiones extremos -> regex
    
    // Evitar rutas reservadas
    const reservedPaths = ['', 'posts', 'home', 'dashboard', 'admin', 'login', 'register', 'profile'];
    if (reservedPaths.includes(path)) {
      path = `${path}_page`;
    }
    
    return path;
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }

  hasErrors(controlName: string, errorType: string) {
    const control = this.formNavItem.get(controlName);
    return control?.hasError(errorType) && control?.touched;
  }
}
