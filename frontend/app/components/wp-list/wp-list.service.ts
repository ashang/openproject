// -- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2015 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
// ++

import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service';
import {QueryFormResource} from '../api/api-v3/hal-resources/query-form-resource.service';
import {HalResource} from '../api/api-v3/hal-resources/hal-resource.service';
import {QueryDmService} from '../api/api-v3/hal-resource-dms/query-dm.service';
import {QueryFormDmService} from '../api/api-v3/hal-resource-dms/query-form-dm.service';
import {States} from '../states.service';
import {SchemaResource} from '../api/api-v3/hal-resources/schema-resource.service';
import {WorkPackageCollectionResource} from '../api/api-v3/hal-resources/wp-collection-resource.service';
import {WorkPackageCacheService} from '../work-packages/work-package-cache.service';
import {WorkPackageTableColumnsService} from '../wp-fast-table/state/wp-table-columns.service';
import {WorkPackageTableSortByService} from '../wp-fast-table/state/wp-table-sort-by.service';
import {WorkPackageTableGroupByService} from '../wp-fast-table/state/wp-table-group-by.service';
import {WorkPackageTableFiltersService} from '../wp-fast-table/state/wp-table-filters.service';
import {WorkPackageTableSumService} from '../wp-fast-table/state/wp-table-sum.service';
import {WorkPackageTablePaginationService} from '../wp-fast-table/state/wp-table-pagination.service';

export class WorkPackagesListService {
  constructor(protected apiWorkPackages:any,
              protected WorkPackageService:any,
              protected QueryService:any,
              protected PaginationService:any,
              protected NotificationsService:any,
              protected UrlParamsHelper:any,
              protected $location:ng.ILocationService,
              protected $q:ng.IQService,
              protected Query:any,
              protected QueryDm:QueryDmService,
              protected QueryFormDm:QueryFormDmService,
              protected states:States,
              protected wpCacheService:WorkPackageCacheService,
              protected wpTableColumns:WorkPackageTableColumnsService,
              //protected wpTableSortBy:WorkPackageTableSortByService,
              protected wpTableGroupBy:WorkPackageTableGroupByService,
              //protected wpTableFilters:WorkPackageTableFiltersService,
              protected wpTableSum:WorkPackageTableSumService,
              protected wpTablePagination:WorkPackageTablePaginationService,
              protected I18n:op.I18n) {}

  /**
   * Resolve API experimental and APIv3 requests using queryParams.
   */
  public fromQueryParams(queryParams:any, projectIdentifier ?:string):ng.IPromise<QueryResource> {
    var queryData = this.UrlParamsHelper.buildV3GetQueryFromJsonParams(queryParams.query_props);

    var wpListPromise = this.QueryDm.find(queryData, queryParams.query_id, projectIdentifier);

    //return this.resolveList(wpListPromise);
    return this.updateStatesFromQueryOnPromise(wpListPromise);
  }

  public reloadQuery(query:QueryResource):ng.IPromise<QueryResource> {
    //var queryData = this.UrlParamsHelper.buildV3GetQueryFromQueryResource(query, {});

    var wpListPromise = this.QueryDm.reload(query);

    //return this.resolveList(wpListPromise);
    return this.updateStatesFromQueryOnPromise(wpListPromise);
  }

  /**
   * Update the list from an existing query object.
   */
  public loadResultsList(query:QueryResource, additionalParams:Object):ng.IPromise<WorkPackageCollectionResource>{
    var wpListPromise = this.QueryDm.loadResults(query, additionalParams);

    //return this.resolveList(wpListPromise);
    return this.updateStatesFromWPListOnPromise(wpListPromise);
  }

  public loadForm(query:QueryResource):ng.IPromise<QueryFormResource>{
    return this.QueryFormDm.load(query);
  }

  public clearUrlQueryParams() {
    this.$location.search('query_props', '');
    this.$location.search('query_id', '');
  }

  /**
   * Resolve the query with experimental API and load work packages through APIv3.
   */
  private resolveList(wpListPromise:ng.IPromise<HalResource>):ng.IPromise<HalResource> {
    //var deferred = this.$q.defer();

    //wpListPromise.then((json:api.ex.WorkPackagesMeta) => {
    //  this.apiWorkPackages
    //    .list(json.meta.page, json.meta.per_page, json.meta.query)
    //    .then((workPackageCollection) => {
    //      this.mergeApiResponses(json, workPackageCollection);

    //      deferred.resolve(json);
    //    })
    //    .catch((error) => {
    //      this.mergeApiResponses(json, { elements: [], count: 0, total: 0 });
    //      deferred.reject({ error: error, json: json });
    //    });
    //});

    //return deferred.promise;
    return wpListPromise;
  }

  private updateStatesFromQueryOnPromise(promise:ng.IPromise<QueryResource>):ng.IPromise<QueryResource> {
    return promise.then(this.updateStatesFromQuery.bind(this))
  }

  private updateStatesFromWPListOnPromise(promise:ng.IPromise<WorkPackageCollectionResource>):ng.IPromise<WorkPackageCollectionResource> {
    return promise.then(this.updateStatesFromWPCollection.bind(this))
  }

  private updateStatesFromQuery(query:QueryResource) {
    this.updateStatesFromWPCollection(query.results);

    this.states.table.query.put(query);
    this.wpTableSum.initialize(query);
    this.wpTableColumns.initialize(query);
    this.wpTableGroupBy.initialize(query);

    return query;
  }

  private updateStatesFromWPCollection(results:WorkPackageCollectionResource) {
    if (results.schemas) {
      _.each(results.schemas.elements, (schema:SchemaResource) => {
        this.states.schemas.get(schema.href as string).put(schema);
      });
    };

    this.$q.all(results.elements.map(wp => wp.schema.$load())).then(() => {
      this.states.table.rows.put(results.elements);
    });

    this.wpCacheService.updateWorkPackageList(results.elements);

    this.states.table.results.put(results);

    this.states.table.groups.put(angular.copy(results.groups));

    this.wpTablePagination.initialize(results);
  }
}

angular
  .module('openproject.workPackages.services')
  .service('wpListService', WorkPackagesListService);
