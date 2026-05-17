import { Component, Input, ContentChild, TemplateRef } from '@angular/core';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'numeric' | 'date' | 'boolean' | 'badge' | 'custom';
  width?: string;
}

@Component({
  selector: 'app-custom-table',
  template: `
    <div class="card table-card overflow-hidden">
      <!-- Tabla con PrimeNG -->
      <p-table
        #dt
        [value]="data"
        [columns]="columns"
        [rows]="rows"
        [paginator]="true"
        [rowsPerPageOptions]="[10, 25, 50]"
        [loading]="loading"
        [globalFilterFields]="globalFilterFields"
        [showCurrentPageReport]="true"
        currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords}"
        styleClass="p-datatable-responsive p-datatable-sm custom-premium-table"
      >
        <!-- Caption / Toolbar -->
        <ng-template pTemplate="caption">
          <div class="table-header-container">
            <h5 class="m-0 table-title" *ngIf="title">{{ title }}</h5>
            
            <div class="toolbar-actions d-flex align-items-center gap-2">
              <!-- Botón Limpiar -->
              <p-button 
                label="Limpiar" 
                styleClass="p-button-outlined p-button-secondary p-button-sm" 
                (onClick)="dt.clear()"
              >
                <i class="fa-solid fa-filter-circle-xmark me-2"></i>
              </p-button>

              <!-- Buscador -->
              <p-inputGroup class="search-input-group">
                <p-inputGroupAddon>
                  <i class="fa-solid fa-magnifying-glass"></i>
                </p-inputGroupAddon>
                <input 
                  pInputText 
                  type="text" 
                  (input)="dt.filterGlobal($any($event.target).value, 'contains')" 
                  [placeholder]="searchPlaceholder" 
                />
              </p-inputGroup>

              <!-- Acciones Extra (ej: Botón Nuevo) -->
              <div class="extra-actions">
                <ng-content select="[extraActions]"></ng-content>
              </div>
            </div>
          </div>
        </ng-template>

        <!-- Cabecera -->
        <ng-template pTemplate="header" let-columns>
          <tr>
            <th *ngFor="let col of columns" [pSortableColumn]="col.sortable ? col.field : undefined" [style.minWidth]="col.width || 'auto'">
              <div class="d-flex align-items-center">
                {{ col.header }}
                <p-sortIcon *ngIf="col.sortable" [field]="col.field" class="ms-1"></p-sortIcon>
                <div class="ms-auto">
                   <p-columnFilter *ngIf="col.type === 'text'" type="text" [field]="col.field" display="menu"></p-columnFilter>
                   <p-columnFilter *ngIf="col.type === 'numeric'" type="numeric" [field]="col.field" display="menu"></p-columnFilter>
                   <p-columnFilter *ngIf="col.type === 'date'" type="date" [field]="col.field" display="menu"></p-columnFilter>
                   <p-columnFilter *ngIf="col.type === 'boolean'" type="boolean" [field]="col.field" display="menu"></p-columnFilter>
                </div>
              </div>
            </th>
            <th *ngIf="hasActions" class="text-center" style="width: 140px">Acciones</th>
          </tr>
        </ng-template>

        <!-- Cuerpo -->
        <ng-template pTemplate="body" let-rowData let-columns="columns">
          <tr>
            <td *ngFor="let col of columns">
              <ng-container [ngSwitch]="col.type">
                <span *ngSwitchCase="'date'">{{ rowData[col.field] | date: 'dd/MM/yyyy' }}</span>
                <span *ngSwitchCase="'numeric'">{{ rowData[col.field] }}</span>
                <span *ngSwitchCase="'boolean'">
                  <i class="fa-solid" [ngClass]="rowData[col.field] ? 'fa-circle-check text-success' : 'fa-circle-xmark text-danger text-opacity-50'"></i>
                </span>
                <span *ngSwitchCase="'badge'">
                  <span class="badge-slug">{{ rowData[col.field] }}</span>
                </span>
                <ng-container *ngSwitchCase="'custom'">
                  <ng-container *ngTemplateOutlet="columnTemplates[col.field]; context: {$implicit: rowData}"></ng-container>
                </ng-container>
                <span *ngSwitchDefault [class.fw-bold]="col.field === 'name'">{{ rowData[col.field] }}</span>
              </ng-container>
            </td>
            <td *ngIf="hasActions" class="text-center">
               <ng-container *ngTemplateOutlet="actionsTemplate; context: {$implicit: rowData}"></ng-container>
            </td>
          </tr>
        </ng-template>

        <!-- Mensaje Vacío -->
        <ng-template pTemplate="emptymessage">
          <tr>
            <td [attr.colspan]="columns.length + (hasActions ? 1 : 0)" class="text-center py-5">
              <div class="empty-state">
                <i class="fa-solid fa-folder-open mb-3 opacity-20" style="font-size: 3rem;"></i>
                <p class="text-muted">No se encontraron registros</p>
              </div>
            </td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  styles: [`
    .table-header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .table-title {
      font-weight: 800;
      font-size: 1.35rem;
      letter-spacing: -0.02em;
      color: var(--rd-header-color, #1e293b);
    }
    .table-actions-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .search-input-group {
      width: 260px;
      transition: width 0.3s ease;
      
      &:focus-within {
        width: 320px;
      }

      ::ng-deep {
        .p-inputgroup-addon {
          background: #f8fafc;
          border-color: #e2e8f0;
          color: #64748b;
        }
        input {
          border-color: #e2e8f0;
          background: #f8fafc;
          font-size: 0.875rem;
          &:focus {
            background: #fff;
            box-shadow: none;
            border-color: var(--primary-color, #3b82f6);
          }
        }
      }
    }
    .extra-actions {
      display: flex;
      gap: 0.5rem;
    }

    ::ng-deep .p-dropdown-items {
      padding-left: 0;

      .p-dropdown-item > span {
        margin-left: 5px;
      }
    }

    :host ::ng-deep {
      .custom-premium-table {
        border: none;
        
        .p-datatable-header {
           background: #fff;
           border-bottom: 1px solid #f1f5f9;
           padding: 1.5rem 2rem;
        }
        
        .p-datatable-thead > tr > th {
          background: #f8fafc;
          color: #475569;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          padding: 1rem 1.5rem;
          border-bottom: 2px solid #f1f5f9;
        }
        
        .p-datatable-tbody > tr {
          transition: background 0.2s;
          &:hover {
            background: #fcfdfe !important;
          }
          
          > td {
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #f1f5f9;
            color: #334155;
            font-size: 0.9rem;
          }
        }

        .p-paginator {
          background: #fff;
          border-top: 1px solid #f1f5f9;
          padding: 1rem;
        }
      }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
      .table-header-container {
        flex-direction: column;
        align-items: flex-start;
      }
      .table-actions-group {
        width: 100%;
        justify-content: space-between;
      }
      .search-input-group {
        width: 100% !important;
        order: 3;
      }
    }
  `]
})
export class CustomTableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() globalFilterFields: string[] = [];
  @Input() rows: number = 10;
  @Input() loading: boolean = false;
  @Input() title: string = '';
  @Input() searchPlaceholder: string = 'Buscar registros...';
  @Input() hasActions: boolean = false;

  @ContentChild('actions') actionsTemplate!: TemplateRef<any>;
  
  columnTemplates: { [key: string]: TemplateRef<any> } = {};
}
