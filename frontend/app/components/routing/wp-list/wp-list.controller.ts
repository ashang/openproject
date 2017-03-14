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

import {WorkPackageCacheService} from '../../work-packages/work-package-cache.service';
import {WorkPackageNotificationService} from '../../wp-edit/wp-notification.service';
import {WorkPackageResourceInterface} from '../../api/api-v3/hal-resources/work-package-resource.service';
import {ErrorResource} from '../../api/api-v3/hal-resources/error-resource.service';
import {States} from '../../states.service';
import {WorkPackageTableColumnsService} from '../../wp-fast-table/state/wp-table-columns.service';
import {WorkPackageTableSortByService} from '../../wp-fast-table/state/wp-table-sort-by.service';
import {WorkPackageTableGroupByService} from '../../wp-fast-table/state/wp-table-group-by.service';
import {WorkPackageTableFiltersService} from '../../wp-fast-table/state/wp-table-filters.service';
import {WorkPackageTableSumService} from '../../wp-fast-table/state/wp-table-sum.service';
import {WorkPackageTablePaginationService} from '../../wp-fast-table/state/wp-table-pagination.service';
import {WorkPackageTablePagination} from '../../wp-fast-table/wp-table-pagination';
import {Observable} from 'rxjs/Observable';
import {LoadingIndicatorService} from '../../common/loading-indicator/loading-indicator.service';
import {QueryResource, QueryColumn} from '../../api/api-v3/hal-resources/query-resource.service';
import {QueryFormResource} from '../../api/api-v3/hal-resources/query-form-resource.service';
import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';
import {WorkPackageCollectionResource} from '../../api/api-v3/hal-resources/wp-collection-resource.service';
import {SchemaResource} from '../../api/api-v3/hal-resources/schema-resource.service';
import {QueryFilterInstanceSchemaResource} from '../../api/api-v3/hal-resources/query-filter-instance-schema-resource.service';

function WorkPackagesListController($scope:any,
                                    $rootScope:ng.IRootScopeService,
                                    $state:ng.ui.IStateService,
                                    $location:ng.ILocationService,
                                    $q:ng.IQService,
                                    states:States,
                                    wpTableColumns:WorkPackageTableColumnsService,
                                    wpTableSortBy:WorkPackageTableSortByService,
                                    wpTableGroupBy:WorkPackageTableGroupByService,
                                    wpTableFilters:WorkPackageTableFiltersService,
                                    wpTableSum:WorkPackageTableSumService,
                                    wpTablePagination:WorkPackageTablePaginationService,
                                    wpListService:any,
                                    AuthorisationService:any,
                                    UrlParamsHelper:any,
                                    loadingIndicator:LoadingIndicatorService,
                                    I18n:op.I18n) {

  $scope.projectIdentifier = $state.params['projectPath'] || null;
  $scope.I18n = I18n;
  $scope.text = {
    'jump_to_pagination': I18n.t('js.work_packages.jump_marks.pagination'),
    'text_jump_to_pagination': I18n.t('js.work_packages.jump_marks.label_pagination')
  };

  $scope.queryChecksum;

  // Setup
  function initialSetup() {
    $scope.disableFilters = false;
    $scope.disableNewWorkPackage = true;

    setupObservers();

    loadQuery();
  }

  function setupObservers() {
    states.table.query.observeOnScope($scope).subscribe(query => {
      $scope.query = query;
      setupPage(query);

      // This should not be necessary as the wp-table directive
      // should care for itself. But without it, we will end up with
      // two result areas.
      $scope.tableInformationLoaded = true;

      updateTitle(query);
    });

    Observable.combineLatest(
      states.table.query.observeOnScope($scope),
      states.table.form.observeOnScope($scope)
    ).subscribe(([query, form]) => {
      let schema = form.schema as QuerySchemaResourceInterface;

      wpTableSortBy.initialize(query, schema);
      wpTableFilters.initialize(query, schema);
      wpTableGroupBy.update(query, schema);
      wpTableColumns.update(query, schema);
    });

    Observable.combineLatest(
      states.table.query.observeOnScope($scope),
      wpTablePagination.observeOnScope($scope),
      wpTableFilters.observeOnScope($scope),
      wpTableColumns.observeOnScope($scope),
      wpTableSortBy.observeOnScope($scope),
      wpTableGroupBy.observeOnScope($scope),
      wpTableSum.observeOnScope($scope)
    ).subscribe(([query, pagination, filters, columns, sortBy, groupBy, sums]) => {

      // TODO: Think about splitting this up (one observer per state) to do less work with copying over the values
      query.sortBy = sortBy.currentSortBys;
      query.groupBy = groupBy.currentGroupBy;
      query.filters = filters.current;
      query.columns = columns.current;
      query.sums = sums.current;

      //TODO: place where it belongs
      let urlParams = JSON.parse(urlParamsForStates(query, pagination));
      delete(urlParams['c'])
      let newQueryChecksum = JSON.stringify(urlParams);

      $scope.maintainUrlQueryState(query, pagination);
      $scope.maintainBackUrl();

      if ($scope.queryChecksum && $scope.queryChecksum != newQueryChecksum) {
        updateResultsVisibly();
      }

      $scope.queryChecksum = newQueryChecksum;
    });
  }

  function loadQuery() {
    loadingIndicator.table.promise = wpListService.fromQueryParams($state.params, $scope.projectIdentifier)
      .then(loadForm);
  }

  function loadForm(query:QueryResource) {
    wpListService.loadForm(query)
      .then(updateStatesFromForm);
  }

  function updateStatesFromForm(form:QueryFormResource) {
    let schema = form.schema as QuerySchemaResourceInterface;

    _.each(schema.filtersSchemas.elements, (schema:QueryFilterInstanceSchemaResource) => {
      states.schemas.get(schema.href as string).put(schema);
    });

    states.table.form.put(form);
  }

  function setupPage(query:QueryResource) {
    $scope.maintainBackUrl();

    setupAuthorization(query);
  }

  function setupAuthorization(query:QueryResource) {
    // Authorisation
    AuthorisationService.initModelAuth('work_package', query.results.$links);
    AuthorisationService.initModelAuth('query', query.$links);
  }

  function urlParamsForStates(query:QueryResource, pagination:WorkPackageTablePagination) {
    return UrlParamsHelper.encodeQueryJsonParams(query, _.pick(pagination, ['page', 'perPage']));
  }

  $scope.setAnchorToNextElement = function () {
    // Skip to next when visible, otherwise skip to previous
    const selectors = '#pagination--next-link, #pagination--prev-link, #pagination-empty-text';
    const visibleLink = jQuery(selectors)
                          .not(':hidden')
                          .first();

   if (visibleLink.length) {
     visibleLink.focus();
   }
  }

  $scope.maintainBackUrl = function () {
    $scope.backUrl = $location.url();
  };

  // Updates

  $scope.maintainUrlQueryState = function (query:QueryResource, pagination:WorkPackageTablePagination) {
    $location.search('query_props', urlParamsForStates(query, pagination));
  };

  function updateResults() {
    var pagination = wpTablePagination.current;

    var params = {
      pageSize: pagination.perPage,
      offset: pagination.page
    };

    var query = states.table.query.getCurrentValue();

    return wpListService.loadResultsList(query, params)
  }

  function updateResultsVisibly() {
    loadingIndicator.table.promise = updateResults();
  }

  $scope.allowed = function(model:string, permission: string) {
    return AuthorisationService.can(model, permission);
  }

  // Go

  initialSetup();

  function updateTitle(query:QueryResource) {
    if (query.id) {
      $scope.selectedTitle = query.name || I18n.t('js.label_work_package_plural');
    }
  }

  $scope.$watchCollection(function(){
    return {
      query_id: $state.params['query_id'],
      query_props: $state.params['query_props']
    };
  }, function(params:any) {
    var query = states.table.query.getCurrentValue();
    var pagination = wpTablePagination.current;

    if (query && pagination) {
      var currentStateParams = urlParamsForStates(query, pagination);

      if (currentStateParams !== params.query_props) {
        initialSetup();
      }
    }
  });

  $rootScope.$on('queryStateChange', function () {
    $scope.maintainUrlQueryState();
    $scope.maintainBackUrl();
  });

  $rootScope.$on('workPackagesRefreshRequired', function () {
    updateResultsVisibly();
  });

  $rootScope.$on('workPackagesRefreshInBackground', function () {
    updateResults();
  });

  $rootScope.$on('queryClearRequired', _ => wpListService.clearUrlQueryParams);
}

angular
  .module('openproject.workPackages.controllers')
  .controller('WorkPackagesListController', WorkPackagesListController);
