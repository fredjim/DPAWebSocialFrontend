import { Component, ElementRef, EventEmitter, inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { InformationService } from '../../../pages/services/information.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Section } from '../../../pages/models/section';
import { MessageService } from 'primeng/api';
import moment from 'moment';
import { SectionStateService } from '../../../pages/services/sections-state.service';
import { AuthService } from '../../../authentication/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { concatMap, debounceTime, distinctUntilChanged, finalize, map, Observable, of, Subscription, tap } from 'rxjs';
import { NavItem } from '../../../pages/models/nav-item';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-form-section',
  templateUrl: './form-section.component.html',
  styleUrl: './form-section.component.scss'
})
export class FormSectionComponent implements OnInit, OnChanges, OnDestroy {
  private readonly informationService = inject(InformationService);
  private readonly messageService = inject(MessageService);
  private readonly sectionStateService = inject(SectionStateService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly subscription = new Subscription();

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
    name: new FormControl('', [Validators.required, Validators.maxLength(40), Validators.minLength(2)]),
    path: new FormControl('', [Validators.required, Validators.maxLength(40), Validators.minLength(2)])
  });

  ngOnInit(): void {
    setTimeout(()=>{
      this.focusInputIfNeeded();
    });

    this.subscription.add(
      this.formSection.get('name')?.valueChanges
      .pipe(
        debounceTime(200), // Espera a que deje de escribir
        distinctUntilChanged() // Solo si el valor cambió
      )
      .subscribe(valor => {
        const pathTransformado = this.getPathFromNameSection(valor || '');
        this.formSection.get('path')?.setValue(pathTransformado, { emitEvent: false });
      })
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(changes['currentSection'] && this.currentSection && this.formSection && this.typeForm === 'edit'){
      this.formSection.patchValue({
        name: this.currentSection.name,
        path: this.currentSection.path
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
      name: this.formSection.value.name?.trim() ?? '',
      path: this.getPathFromNameSection(this.formSection.value.path!.trim())
    }
    
    this.informationService.createSection(newSection).subscribe({
      next: (created) => {
        this.isLoading = false;
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección creada exitosamente' });
        this.onCreateSection.emit(created);
        this.closeForm();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.log('Error al crear seccion', error);
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
      date: moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
      name: this.formSection.value.name?.trim() ?? '',
      path: this.getPathFromNameSection(this.formSection.value.path!.trim())
    }

    this.informationService.updateSection(updatedSection).subscribe({
      next: (updated) => {
        this.isLoading = false;
        this.sectionStateService.setSectionToEdit(updated);
        this.messageService.add({ severity: 'success', summary: 'Exitoso', detail: 'Sección actualizada exitosamente' });
        this.onEditedSection.emit(updated);
        this.handleRedirectionAfterEdit(updated);
        this.closeForm();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        console.log('Error al editar seccion', error);
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
        error: (err: HttpErrorResponse) => this.handleDeleteError(err)
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

  private handleDeleteError(err: HttpErrorResponse): void {
    console.log('error', err);
    this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar sección' });
    this.onCloseEdit.emit();
  }

  private handleRedirectionIfNeeded(): Observable<void> {
    const currentSectionUrlPath = this.route.snapshot.firstChild?.paramMap.get('pathSection');
    if (currentSectionUrlPath && currentSectionUrlPath === this.currentSection?.path) {
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

  private performRedirection(currentNavItemPath: string, sections: Section[]): void {
    if (sections.length > 0) {
      const firstSection = sections[0];
      this.router.navigate(['../' + currentNavItemPath, firstSection.path], { relativeTo: this.route });
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

  private handleRedirectionAfterEdit(updatedSection: Section): void {
    const currentSectionUrlPath = this.route.snapshot.firstChild?.paramMap.get('pathSection');
    // Si se edito la seccion en la que estamos ubicados
    if (currentSectionUrlPath && currentSectionUrlPath === this.currentSection?.path) {
      // Actualizar el currentSection y redirigir a su nueva ruta
      this.currentSection = updatedSection;
      const currentNavItemPath = this.route.snapshot.paramMap.get('pathNavItem');
      this.router.navigate(['../' + currentNavItemPath, updatedSection.path], { relativeTo: this.route });
    }
  }

  private focusInputIfNeeded(): void {
    setTimeout(() => {
      if (this.firstInput?.nativeElement) {
        this.firstInput.nativeElement.focus();
      }
    }, 200);
  }

  private getPathFromNameSection(label: string): string {
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
}
