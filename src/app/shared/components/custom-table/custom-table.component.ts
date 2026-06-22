import { Component, Input, ContentChild, TemplateRef, Output, EventEmitter } from '@angular/core';

export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  type?: 'text' | 'numeric' | 'date' | 'boolean' | 'badge' | 'custom';
  width?: string;
}

@Component({
  selector: 'app-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
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

  // Propiedades para Paginación de Servidor (Lazy Load)
  @Input() lazy: boolean = false;
  @Input() totalRecords: number = 0;
  @Output() onLazyLoad = new EventEmitter<any>();

  @ContentChild('actions') actionsTemplate!: TemplateRef<any>;
  
  columnTemplates: { [key: string]: TemplateRef<any> } = {};
}
