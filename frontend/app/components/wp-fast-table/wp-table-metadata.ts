import {GroupObject} from '../api/api-v3/hal-resources/wp-collection-resource.service';
import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service';

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

  constructor(public query:QueryResource) {
    // Grouping data
    //this.groupBy = query.groupBy.id;
    this.groups = query.results.groups;
    //this.groupableColumns = meta.groupable_columns;

    // Sums
    this.totalSums = query.results.totalSums;

    // Links
    this.links = query.$links;

    //TODO: add bulk links and export formats to query resoure
    //this.bulkLinks = json.links;
    //this.exportFormats = meta.export_formats;

    // Pagination
    this.total = query.results.total;
    this.count = query.results.count;
    this.pageSize = query.results.pageSize;
    this.page = query.results.offset;
  }

  /**
   * Returns whether the current result is using a group by clause.
   */
  public get isGrouped():boolean {
    return !!this.groupBy;
  }
}
