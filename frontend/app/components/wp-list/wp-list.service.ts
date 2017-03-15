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
import {QueryDmService, PaginationObject} from '../api/api-v3/hal-resource-dms/query-dm.service';
import {QueryFormDmService} from '../api/api-v3/hal-resource-dms/query-form-dm.service';
import {States} from '../states.service';
import {SchemaResource} from '../api/api-v3/hal-resources/schema-resource.service';
import {WorkPackageCollectionResource} from '../api/api-v3/hal-resources/wp-collection-resource.service';
import {QuerySchemaResourceInterface} from '../api/api-v3/hal-resources/query-schema-resource.service';
import {QueryFilterInstanceSchemaResource} from '../api/api-v3/hal-resources/query-filter-instance-schema-resource.service';
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
              protected AuthorisationService:any,
              protected $location:ng.ILocationService,
              protected $q:ng.IQService,
              protected Query:any,
              protected QueryDm:QueryDmService,
              protected QueryFormDm:QueryFormDmService,
              protected states:States,
              protected wpCacheService:WorkPackageCacheService,
              protected wpTableColumns:WorkPackageTableColumnsService,
              protected wpTableSortBy:WorkPackageTableSortByService,
              protected wpTableGroupBy:WorkPackageTableGroupByService,
              protected wpTableFilters:WorkPackageTableFiltersService,
              protected wpTableSum:WorkPackageTableSumService,
              protected wpTablePagination:WorkPackageTablePaginationService,
              protected I18n:op.I18n) {}

  /**
   * Resolve API experimental and APIv3 requests using queryParams.
   */
  public fromQueryParams(queryParams:any, projectIdentifier ?:string):ng.IPromise<QueryResource> {
    var queryData = this.UrlParamsHelper.buildV3GetQueryFromJsonParams(queryParams.query_props);

    this.clearDependentStates();

    var wpListPromise = this.QueryDm.find(queryData, queryParams.query_id, projectIdentifier);

    let promise = this.updateStatesFromQueryOnPromise(wpListPromise);

    return this.conditionallyLoadForm(promise);
  }

  public reloadQuery(query:QueryResource):ng.IPromise<QueryResource> {
    let pagination = this.getPaginationInfo();
    pagination.offset = 1;

    this.clearDependentStates();

    let wpListPromise = this.QueryDm.reload(query, pagination);

    let promise = this.updateStatesFromQueryOnPromise(wpListPromise);

    return this.conditionallyLoadForm(promise);
  }

  /**
   * Update the list from an existing query object.
   */
  public loadResultsList(query:QueryResource, additionalParams:PaginationObject):ng.IPromise<WorkPackageCollectionResource> {
    let wpListPromise = this.QueryDm.loadResults(query, additionalParams);

    return this.updateStatesFromWPListOnPromise(wpListPromise);
  }

  /**
   * Reload the list of work packages for the current query keeping the
   * pagination options.
   */
  public reloadCurrentResultsList():ng.IPromise<WorkPackageCollectionResource> {
    let pagination = this.getPaginationInfo();
    let query = this.states.table.query.getCurrentValue()!;

    return this.loadResultsList(query, pagination)
  }

  public loadForm(query:QueryResource):ng.IPromise<QueryFormResource>{
    return this.QueryFormDm.load(query).then((form:QueryFormResource) => {
      this.updateStatesFromForm(query, form);

      return form;
    });
  }

  public clearUrlQueryParams() {
    this.$location.search('query_props', '');
    this.$location.search('query_id', '');
  }

  private getPaginationInfo() {
    let pagination = this.wpTablePagination.current;

    return {
      pageSize: pagination.perPage,
      offset: pagination.page
    };
  }

  private conditionallyLoadForm(promise:ng.IPromise<QueryResource>):ng.IPromise<QueryResource> {
    promise.then(query => {

      let currentForm = this.states.table.form.getCurrentValue();

      if (!currentForm || query.$links.update.$href !== currentForm.$href) {
        this.loadForm(query);
      }

      return query;
    })

    return promise;
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
    return promise.then(query => {
      this.updateStatesFromQuery(query);

      return query;
    });
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

    this.AuthorisationService.initModelAuth('query', query.$links);
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

    this.AuthorisationService.initModelAuth('work_package', results.$links);
  }

  private updateStatesFromForm(query:QueryResource, form:QueryFormResource) {
    let schema = form.schema as QuerySchemaResourceInterface;

    _.each(schema.filtersSchemas.elements, (schema:QueryFilterInstanceSchemaResource) => {
      this.states.schemas.get(schema.href as string).put(schema);
    });

    this.states.table.form.put(form);
    this.wpTableSortBy.initialize(query, schema);
    this.wpTableFilters.initialize(query, schema);
    this.wpTableGroupBy.update(query, schema);
    this.wpTableColumns.update(query, schema);
  }

  private clearDependentStates() {
    this.states.table.pagination.clear();
    this.states.table.filters.clear();
    this.states.table.columns.clear();
    this.states.table.sortBy.clear();
    this.states.table.groupBy.clear();
    this.states.table.sum.clear();
  }
}

angular
  .module('openproject.workPackages.services')
  .service('wpListService', WorkPackagesListService);
