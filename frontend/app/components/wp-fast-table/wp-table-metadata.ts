import {GroupObject} from '../api/api-v3/hal-resources/wp-collection-resource.service';
import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service';
import {WorkPackageCollectionResource} from '../api/api-v3/hal-resources/wp-collection-resource.service';

interface TablePaginationOptions {
  // Current page we're on
  page:number;
  // Number of elements per page
  perPage:number;
  // Available options for perPage
  perPageOptions:number[];
}

/**
 * Contains references to the current metadata returned from the API
 * accompanying a result set of work packages.
 */
export class WorkPackageTableMetadata {
  // Reference to an attribute that the results are grouped by
  public groupBy?:string;
  public groups:GroupObject[];

  // Total number of results
  public total:number;
  public count:number;
  public pageSize:number;
  public page:number;

  // Available links returned from collection resource
  public links:{ [name:string]: string };
  public bulkLinks:{ [name:string]: string };

  // Groupable columns
  public groupableColumns:api.ex.Column[];

  // Sums
  public totalSums:{[attribute:string]: any};

  // Export formats
  public exportFormats:api.ex.ExportFormat[];

  constructor(query:QueryResource) {
    // Grouping data
    //this.groupBy = query.groupBy.id;
    this.groups = query.results.groups;
    //this.groupableColumns = meta.groupable_columns;

    // Sums
    this.totalSums = query.results.totalSums || [];

    // Links
    this.links = query.$links;

    //TODO: add bulk links and export formats to query resoure
    //this.bulkLinks = json.links;
    //this.exportFormats = meta.export_formats;

    this.updateByQueryResults(query.results)
  }

  /**
   * Returns whether the current result is using a group by clause.
   */
  public get isGrouped():boolean {
    return !!this.groupBy;
  }

  public updateByQueryResults(results:WorkPackageCollectionResource) {
    // Pagination
    this.total = results.total;
    this.count = results.count;
    this.pageSize = results.pageSize;
    this.page = results.offset;
  }
}
