import {WorkPackageTableMetadata} from '../wp-table-metadata';
import {States} from '../../states.service';
import {opServicesModule} from '../../../angular-modules';
import {State} from '../../../helpers/reactive-fassade';
import {WPTableRowSelectionState} from '../wp-table.interfaces';
import {QueryColumn} from '../../api/api-v3/hal-resources/query-resource.service'
import {Observable} from 'rxjs/Observable';

export class WorkPackageTableColumnsService {

  // Available columns state
  public availableColumnsState:State<QueryColumn[]>;

  // The selected columns state of the current table instance
  public columnsState:State<QueryColumn[]>;

  constructor(public states: States) {
    this.columnsState = states.table.columns;
    this.availableColumnsState = states.query.availableColumns;
  }

  /**
   * Retrieve the QueryColumn objects for the selected columns
   */
  public getColumns():any[] {
    return this.currentState;
  }

  /**
   * Return the index of the given column or -1 if it is not contained.
   */
  public index(id:string):number {
    return _.findIndex(this.currentState, column => column.id === id);
  }

  /**
   * Return the previous column of the given column name
   * @param name
   */
  public previous(column:QueryColumn):QueryColumn|null {
    let index = this.index(column.id);

    if (index <= 0) {
      return null;
    }

    return this.currentState[index - 1];
  }

  /**
   * Return the next column of the given column name
   * @param name
   */
  public next(column:QueryColumn):QueryColumn|null {
    let index = this.index(column.id);

    if (index === -1 || this.isLast(name)) {
      return null;
    }

    return this.currentState[index + 1];
  }

  /**
   * Returns true if the column is the first selected
   */
  public isFirst(column:QueryColumn):boolean {
    return this.index(column.id) === 0;
  }

  /**
   * Returns true if the column is the last selected
   */
  public isLast(column:QueryColumn):boolean {
    return this.index(column.id) === this.columnCount - 1;
  }

  /**
   * Update the selected columns to a new set of columns.
   */
  public setColumns(columns:QueryColumn[]) {
    this.columnsState.put(columns);
  }

  /**
   * Move the column at index {fromIndex} to {toIndex}.
   * - If toIndex is larger than all columns, insert at the end.
   * - If toIndex is less than zero, insert at the start.
   */
  public moveColumn(fromIndex:number, toIndex:number) {
    let columns = this.currentState;

    if (toIndex >= columns.length) {
      toIndex = columns.length - 1;
    }

    if (toIndex < 0) {
      toIndex = 0;
    }

    let element = columns[fromIndex];
    columns.splice(fromIndex, 1);
    columns.splice(toIndex, 0, element);

    this.setColumns(columns);
  }

  /**
   * Shift the given column name X indices,
   * where X is the offset in indices (-1 = shift one to left)
   */
  public shift(column:QueryColumn, offset:number) {
    let index = this.index(column.id);
    if (index === -1) {
      return;
    }

    this.moveColumn(index, index + offset);
  }

  /**
   * Add a new column to the selection at the given position
   */
  public addColumn(id:string, position?:number) {
    let columns = this.currentState;

    if (position === undefined) {
      position = columns.length;
    }

    if (this.index(id) === -1) {
      let newColumn =  _.find(this.all, (column) => column.id === id);

      if (!newColumn) {
        throw "Column with provided name is not found";
      }

      columns.splice(position, 0, newColumn);
      this.setColumns(columns);
    }
  }

  /**
   * Remove a column from the active list
   */
  public removeColumn(column:QueryColumn) {
    let index = this.index(column.id);

    if (index !== -1) {
      let columns = this.currentState;
      columns.splice(index, 1);
      this.setColumns(columns);
    }
  }


  /**
   * Get current selection state.
   * @returns {WPTableRowSelectionState}
   */
  public get currentState():QueryColumn[] {
    return (this.columnsState.getCurrentValue() || []);
  }

  /**
   * Return the number of selected rows.
   */
  public get columnCount():number {
    return this.currentState.length;
  }

  /**
   * Get all available columns (regardless of whether they are selected already)
   */
  public get all():QueryColumn[] {
    return this.availableColumnsState.getCurrentValue() || [];
  }

  /**
   * Get columns not yet selected
   */
  public get unused():QueryColumn[] {
    return _.differenceBy(this.all, this.currentState, '$href');
  }
}

opServicesModule.service('wpTableColumns', WorkPackageTableColumnsService);
