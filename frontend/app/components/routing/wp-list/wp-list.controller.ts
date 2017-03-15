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
                                    AuthorisationService:any,
                                    states:States,
                                    wpTableColumns:WorkPackageTableColumnsService,
                                    wpTableSortBy:WorkPackageTableSortByService,
                                    wpTableGroupBy:WorkPackageTableGroupByService,
                                    wpTableFilters:WorkPackageTableFiltersService,
                                    wpTableSum:WorkPackageTableSumService,
                                    wpTablePagination:WorkPackageTablePaginationService,
                                    wpListService:any,
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

      //TODO: remove
      $scope.query = query;

      $scope.maintainBackUrl();

      // This should not be necessary as the wp-table directive
      // should care for itself. But without it, we will end up with
      // two result areas.
      $scope.tableInformationLoaded = true;

      updateTitle(query);
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

      // The combineLatest retains the last value of each observable regardless of
      // whether it has become null|undefined in the meantime.
      // As we alter the query's property from it's dependent states, we have to ensure
      // that we do not set them if he dependent state does depend on another query with
      // the value only being available because it is still retained.
      if (!states.table.pagination.getCurrentValue() ||
          !states.table.filters.getCurrentValue() ||
          !states.table.columns.getCurrentValue() ||
          !states.table.sortBy.getCurrentValue() ||
          !states.table.groupBy.getCurrentValue() ||
          !states.table.sum.getCurrentValue()) {

        $scope.queryChecksum = null;
        return;
      }

      query.sortBy = sortBy.currentSortBys;
      query.groupBy = groupBy.currentGroupBy;
      query.filters = filters.current;
      query.columns = columns.current;
      query.sums = sums.current;

      //TODO: place where it belongs
      let newQueryChecksum = urlParamsForStates(query as QueryResource, pagination);

      if ($scope.queryChecksum) {
        let parsedNewChecksum = JSON.parse(newQueryChecksum);
        delete(parsedNewChecksum['c'])
        let newQueryChecksumWithoutColumns = JSON.stringify(parsedNewChecksum);

        let parsedCurrentChecksum = JSON.parse($scope.queryChecksum);
        delete(parsedCurrentChecksum['c'])
        let currentQueryChecksumWithoutColumns = JSON.stringify(parsedCurrentChecksum);

        if ($scope.queryChecksum != newQueryChecksum) {
          $scope.maintainUrlQueryState(query, pagination);
          $scope.maintainBackUrl();
        }

        if (paramsStringWithoutColumns($scope.queryChecksum) != paramsStringWithoutColumns(newQueryChecksum)) {
          updateResultsVisibly();
        }
      }

      $scope.queryChecksum = newQueryChecksum;
    });
  }

  function loadQuery() {
    loadingIndicator.table.promise = wpListService.fromQueryParams($state.params, $scope.projectIdentifier);
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
    if (query.id) {
      $location.search('query_id', query.id);
    }
    $location.search('query_props', urlParamsForStates(query, pagination));
  };

  function updateResults() {
    return wpListService.reloadCurrentResultsList()
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

  function paramsStringWithoutColumns(paramsString:string) {
    let parsedString = JSON.parse(paramsString);
    delete(parsedString['c'])
    return JSON.stringify(parsedString);
  }

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
