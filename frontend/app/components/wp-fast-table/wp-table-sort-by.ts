import {
  QuerySortByResource,
  QUERY_SORT_BY_ASC,
  QUERY_SORT_BY_DESC
} from '../api/api-v3/hal-resources/query-sort-by-resource.service';
import {
  QueryResource,
  QueryColumn
} from '../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../api/api-v3/hal-resources/query-schema-resource.service';

export class WorkPackageTableSortBy {
  public availableSortBys:QuerySortByResource[] = [];
  public currentSortBys:QuerySortByResource[] = [];

  constructor(query:QueryResource, schema:QuerySchemaResourceInterface) {
    this.currentSortBys = angular.copy(query.sortBy);
    this.availableSortBys = angular.copy(schema.sortBy.allowedValues as QuerySortByResource[]);

  }

  public addCurrent(sortBy:QuerySortByResource) {
    this.currentSortBys.unshift(sortBy);

    this.currentSortBys = _.uniqBy(this.currentSortBys,
                                   sortBy => sortBy.column.$href)
                          .slice(0, 3);
  }

  public setCurrent(sortBys:QuerySortByResource[]) {
    this.currentSortBys = [];

    _.reverse(sortBys);

    _.each(sortBys, sortBy => this.addCurrent(sortBy));
  }

  public addCurrentAsc(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_ASC);

    if (available) {
      this.addCurrent(available);
    }
  }

  public addCurrentDesc(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_DESC);

    if (available) {
      this.addCurrent(available);
    }
  }

  public isSortable(column:QueryColumn):boolean {
    return !!this.findAnyAvailable(column);
  }

  public findAnyAvailable(column:QueryColumn):QuerySortByResource|null {
    return _.find(this.availableSortBys,
                  (candidate) => candidate.column.$href === column.$href) || null;
  }

  public findAvailableDirection(column:QueryColumn, direction:string):QuerySortByResource|null {
    return _.find(this.availableSortBys,
                  (candidate) => (candidate.column.$href === column.$href &&
                                  candidate.direction.$href === direction)) || null;
  }
}
