import {QuerySortByResource} from '../api/api-v3/hal-resources/query-sort-by-resource.service';
import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../api/api-v3/hal-resources/query-schema-resource.service';

export class WorkPackageTableSortBy {
  public availableSortBys:QuerySortByResource[] = [];
  public currentSortBys:QuerySortByResource[] = [];

  public updateFromQuery(query:QueryResource) {
    this.currentSortBys = angular.copy(query.sortBy);
  }

  public updateFromSchema(schema:QuerySchemaResourceInterface) {
    this.availableSortBys = angular.copy(schema.sortBy.allowedValues as QuerySortByResource[]);
  }
}
