import { Component, OnInit } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { Title } from '@angular/platform-browser';
import { TenantService } from './core/services/tenant.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  constructor(
    private readonly primengConfig: PrimeNGConfig,
    private readonly titleService: Title,
    private readonly tenantService: TenantService
  ) {}

  ngOnInit(): void{
    this.setDynamicTitle();
    this.configPrimeNG();
  }

  private setDynamicTitle() {
    const subdomain = this.tenantService.getSlug();
    const title = subdomain ? `${subdomain.toUpperCase()}-UMSS` : 'UMSS';
    this.titleService.setTitle(title);
  }

  private configPrimeNG():void {
    this.primengConfig.ripple = true;
    this.primengConfig.setTranslation({
      startsWith: 'Empieza con',
      contains: 'Contiene',
      notContains: 'No contiene',
      endsWith: 'Termina con',
      equals: 'Igual a',
      notEquals: 'Diferente a',
      noFilter: 'Sin filtro',
      lt: 'Menor que',
      lte: 'Menor o igual que',
      gt: 'Mayor que',
      gte: 'Mayor o igual que',
      is: 'Es',
      isNot: 'No es',
      before: 'Antes de',
      after: 'Después de',
      dateIs: 'Fecha igual a',
      dateIsNot: 'Fecha diferente a',
      dateBefore: 'Fecha antes de',
      dateAfter: 'Fecha después de',
      clear: 'Limpiar',
      apply: 'Aplicar',
      matchAll: 'Coincidir todo',
      matchAny: 'Coincidir alguno',
      addRule: 'Agregar regla',
      removeRule: 'Eliminar regla',
      accept: 'Sí',
      reject: 'No',
      choose: 'Elegir',
      upload: 'Subir',
      cancel: 'Cancelar',
      // close: 'Cerrar',
      today: 'Hoy',
      weekHeader: 'Sem',
      firstDayOfWeek: 1,
      dayNames: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
      dayNamesShort: ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],
      dayNamesMin: ['D','L','M','X','J','V','S'],
      monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
      monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
      dateFormat: 'dd/mm/yy',
      emptyMessage: 'Sin resultados',
      emptyFilterMessage: 'Sin resultados',
      aria: {
        trueLabel: 'Verdadero',
        falseLabel: 'Falso',
        nullLabel: 'No seleccionado',
        pageLabel: 'Página',
        firstPageLabel: 'Primera página',
        lastPageLabel: 'Última página',
        nextPageLabel: 'Siguiente página',
        previousPageLabel: 'Página anterior',
        slideNumber: '{slideNumber}',
        star: '1 estrella',
        stars: '{star} estrellas',
        selectAll: 'Todos los elementos seleccionados',
        unselectAll: 'Todos los elementos deseleccionados',
        close: 'Cerrar',
        previous: 'Anterior',
        next: 'Siguiente',
        navigation: 'Navegación',
        scrollTop: 'Volver arriba',
        moveTop: 'Mover al inicio',
        moveUp: 'Subir',
        moveDown: 'Bajar',
        moveBottom: 'Mover al final',
        moveToTarget: 'Mover al destino',
        moveToSource: 'Mover al origen',
        moveAllToTarget: 'Mover todo al destino',
        moveAllToSource: 'Mover todo al origen',
        rowsPerPageLabel: 'Filas por página',
        jumpToPageDropdownLabel: 'Ir a página',
        jumpToPageInputLabel: 'Ir a página',
        selectRow: 'Fila seleccionada',
        unselectRow: 'Fila deseleccionada',
        expandRow: 'Fila expandida',
        collapseRow: 'Fila contraída',
        showFilterMenu: 'Mostrar menú de filtros',
        hideFilterMenu: 'Ocultar menú de filtros',
        filterOperator: 'Operador de filtro',
        filterConstraint: 'Restricción de filtro',
        editRow: 'Editar fila',
        saveEdit: 'Guardar edición',
        cancelEdit: 'Cancelar edición',
        listView: 'Vista de lista',
        gridView: 'Vista de cuadrícula',
        zoomImage: 'Ampliar imagen',
        zoomIn: 'Acercar',
        zoomOut: 'Alejar',
        rotateRight: 'Rotar a la derecha',
        rotateLeft: 'Rotar a la izquierda',
        listLabel: 'Lista de opciones',
        maximizeLabel: 'Maximizar',
      }
    });
  }
}
