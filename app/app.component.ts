import { StatePersistingService } from './state-persisting.service';
import { Component } from '@angular/core';
import { process, State } from '@progress/kendo-data-query';
import { sampleProducts } from './products';
import { GridComponent } from '@progress/kendo-angular-grid';
import { GridSettings } from './grid-settings.interface';
import { ColumnSettings } from './column-settings.interface';

@Component({
  selector: 'my-app',
  template: `
    <kendo-grid
      #grid
      [data]="gridSettings.gridData"
      [pageSize]="gridSettings.state.take"
      [skip]="gridSettings.state.skip"
      [sort]="gridSettings.state.sort"
      [filter]="gridSettings.state.filter"
      [sortable]="true"
      [pageable]="true"
      [filterable]="true"
      [resizable]="true"
      [reorderable]="true"
      [columnMenu]="true"
      (dataStateChange)="dataStateChange($event)"
    >
      <ng-template kendoGridToolbarTemplate>
        <button class="k-button" (click)="saveGridSettings(grid)">Save current state</button>
        <button
            class="k-button"
            *ngIf="savedStateExists"
            (click)="gridSettings = mapGridSettings(persistingService.get('gridSettings'))">Load saved state</button>
      </ng-template>
      <kendo-grid-column *ngFor="let col of gridSettings.columnsConfig"
        [field]="col.field"
        [title]="col.title"
        [width]="col._width"
        [filter]="col.filter"
        [filterable]="col.filterable"
        [hidden]="col.hidden"
        [format]="col.format">
      </kendo-grid-column>
    </kendo-grid>
  `,
  styles: []
})
export class AppComponent {
  public gridSettings: GridSettings = {
    state: {
      skip: 0,
      take: 5,

      // Initial filter descriptor
      filter: {
        logic: 'and',
        filters: []
      }
    },
    gridData: process(sampleProducts, {
      skip: 0,
      take: 5,
      // Initial filter descriptor
      filter: {
        logic: 'and',
        filters: []
      }
    }),
    columnsConfig: [{
      field: 'ProductID',
      title: 'ID',
      filterable: false,
      _width: 40
    }, {
      field: 'ProductName',
      title: 'Product Name',
      filterable: true,
      _width: 300
    }, {
      field: 'FirstOrderedOn',
      title: 'First Ordered On',
      filter: 'date',
      format: '{0:d}',
      _width: 240,
      filterable: true
    }, {
      field: 'UnitPrice',
      title: 'Unit Price',
      filter: 'numeric',
      format: '{0:c}',
      _width: 180,
      filterable: true
    }, {
      field: 'Discontinued',
      filter: 'boolean',
      _width: 120,
      filterable: true
    }]
  };

  public get savedStateExists(): boolean {
    return !!this.persistingService.get('gridSettings');
  }

  constructor(public persistingService: StatePersistingService) {
    const gridSettings: GridSettings = this.persistingService.get('gridSettings');

    if (gridSettings !== null) {
      this.gridSettings = this.mapGridSettings(gridSettings);
    }
  }

  public dataStateChange(state: State): void {
      this.gridSettings.state = state;
      this.gridSettings.gridData = process(sampleProducts, state);
  }

  public saveGridSettings(grid: GridComponent): void {
    const columns = grid.columns;

    const gridConfig = {
      state: this.gridSettings.state,
      columnsConfig: columns.toArray().map(item => {
        return Object.keys(item)
          .filter(propName => !propName.toLowerCase()
            .includes('template'))
            .reduce((acc, curr) => ({...acc, ...{[curr]: item[curr]}}), <ColumnSettings> {});
      })
    };

    this.persistingService.set('gridSettings', gridConfig);
  }

  public mapGridSettings(gridSettings: GridSettings): GridSettings {
    const state = gridSettings.state;
    this.mapDateFilter(state.filter);

    return {
      state,
      columnsConfig: gridSettings.columnsConfig.sort((a, b) => a.orderIndex - b.orderIndex),
      gridData: process(sampleProducts, state)
    };
  }

  private mapDateFilter = (descriptor: any) => {
    const filters = descriptor.filters || [];

    filters.forEach(filter => {
        if (filter.filters) {
            this.mapDateFilter(filter);
        } else if (filter.field === 'FirstOrderedOn' && filter.value) {
            filter.value = new Date(filter.value);
        }
    });
  }
}
