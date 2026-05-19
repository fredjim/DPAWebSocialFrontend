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

  @ContentChild('actions') actionsTemplate!: TemplateRef<any>;
  
  columnTemplates: { [key: string]: TemplateRef<any> } = {};
}
