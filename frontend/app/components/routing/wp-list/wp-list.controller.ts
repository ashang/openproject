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

  //$scope.queryChecksum;
  let currentQueryChecksum:string|null;
  let currentQueryId:number|null;

  // Setup
  function initialSetup() {
    setupObservers();

    loadQuery();
  }

  function setupObservers() {
    //Observable.combineLatest(
    //  states.table.query.observeOnScope($scope),
   ////   wpTablePagination.observeOnScope($scope)
    //).subscribe(([query, pagination]) => {

    //  // TODO: remove
    //  $scope.query = query;

    ////  $scope.maintainBackUrl();

    //  // This should not be necessary as the wp-table directive
    //  // should care for itself. But without it, we will end up with
    //  // two result areas.
    //  $scope.tableInformationLoaded = true;

    //  updateTitle(query);
    //});

    //Observable.combineLatest(
    //  //states.table.query.observeOnScope($scope),
    //  wpTablePagination.observeOnScope($scope),
    //  wpTableFilters.observeOnScope($scope),
    //  wpTableColumns.observeOnScope($scope),
    //  wpTableSortBy.observeOnScope($scope),
    //  wpTableGroupBy.observeOnScope($scope),
    //  wpTableSum.observeOnScope($scope)
    //).subscribe(([pagination, filters, columns, sortBy, groupBy, sums]) => {

    //  // The combineLatest retains the last value of each observable regardless of
    //  // whether it has become null|undefined in the meantime.
    //  // As we alter the query's property from it's dependent states, we have to ensure
    //  // that we do not set them if he dependent state does depend on another query with
    //  // the value only being available because it is still retained.
    //  if (isAnyDependentStateClear()) {
    //    currentQueryChecksum = null;
    //    currentQueryId = null;
    //  } else {
    //    let query = states.table.query.getCurrentValue();

    //    query.sortBy = _.cloneDeep(sortBy.currentSortBys);
    //    query.groupBy = _.cloneDeep(groupBy.current);
    //    query.filters = _.cloneDeep(filters.current);
    //    query.columns = _.cloneDeep(columns.current);
    //    query.sums = _.cloneDeep(sums.current);

    //    let newQueryChecksum = urlParamsForStates(query as QueryResource, pagination);

    //    if (currentQueryChecksum) {
    //      if (newQueryChecksum != currentQueryChecksum) {
    //        $scope.maintainUrlQueryState(query, pagination);
    //        $scope.maintainBackUrl();
    //      }

    //      if (paramsStringWithoutColumns(newQueryChecksum!) != paramsStringWithoutColumns(currentQueryChecksum!)) {
    //        updateResultsVisibly();
    //      }
    //    }

    //    // TODO: move to method
    //    if (query.id !== currentQueryId) {
    //      $state.go('.', {query_props: null, query_id: query.id}, { notify: false });
    //    }

    //    currentQueryChecksum = newQueryChecksum;
    //    currentQueryId = query.id;
    //  }
    //});

    Observable.combineLatest(
      states.table.query.observeOnScope($scope),
   //   wpTablePagination.observeOnScope($scope)
    ).subscribe(([query, pagination]) => {

      // TODO: remove
      $scope.query = query;

    //  $scope.maintainBackUrl();

      // This should not be necessary as the wp-table directive
      // should care for itself. But without it, we will end up with
      // two result areas.
      $scope.tableInformationLoaded = true;

      updateTitle(query);
    });

    Observable.combineLatest(
      //states.table.query.observeOnScope($scope),
      wpTablePagination.observeOnScope($scope),
      wpTableFilters.observeOnScope($scope),
      wpTableColumns.observeOnScope($scope),
      wpTableSortBy.observeOnScope($scope),
      wpTableGroupBy.observeOnScope($scope),
      wpTableSum.observeOnScope($scope)
    ).subscribe(([pagination, filters, columns, sortBy, groupBy, sums]) => {

      // The combineLatest retains the last value of each observable regardless of
      // whether it has become null|undefined in the meantime.
      // As we alter the query's property from it's dependent states, we have to ensure
      // that we do not set them if he dependent state does depend on another query with
      // the value only being available because it is still retained.
      if (isAnyDependentStateClear()) {
      } else {
        let query = states.table.query.getCurrentValue();

        query.sortBy = _.cloneDeep(sortBy.currentSortBys);
        query.groupBy = _.cloneDeep(groupBy.current);
        query.filters = _.cloneDeep(filters.current);
        query.columns = _.cloneDeep(columns.current);
        query.sums = _.cloneDeep(sums.current);

        let newQueryChecksum = urlParamsForStates(query as QueryResource, pagination);

        //if (currentQueryChecksum) {
        //  if (newQueryChecksum != currentQueryChecksum) {
        //    $scope.maintainUrlQueryState(query, pagination);
        //    $scope.maintainBackUrl();
        //  }

        //  if (paramsStringWithoutColumns(newQueryChecksum!) != paramsStringWithoutColumns(currentQueryChecksum!)) {
        //    updateResultsVisibly();
        //  }
        //}

        //
        // TODO: move to method
        let queryChanged = (query.id !== currentQueryId);

        if (queryChanged) {
          $state.go('.', { query_props: null, query_id: query.id }, { notify: false });

          currentQueryChecksum = null;
          currentQueryId = null;

        } else if (currentQueryChecksum && newQueryChecksum !== currentQueryChecksum) {
          $scope.maintainUrlQueryState(query, pagination);
          $scope.maintainBackUrl();
        }

        if (currentQueryChecksum && paramsStringWithoutColumns(newQueryChecksum!) !== paramsStringWithoutColumns(currentQueryChecksum!)) {
          updateResultsVisibly();
        }

        currentQueryChecksum = newQueryChecksum;
        currentQueryId = query.id;
      }
    });

    //Observable.combineLatest(
    //  //states.table.query.observeOnScope($scope),
    //  wpTableFilters.observeOnScope($scope),
    //  wpTableColumns.observeOnScope($scope),
    //  wpTableSortBy.observeOnScope($scope),
    //  wpTableGroupBy.observeOnScope($scope),
    //  wpTableSum.observeOnScope($scope)
    //).subscribe(([filters, columns, sortBy, groupBy, sums]) => {

    //  // The combineLatest retains the last value of each observable regardless of
    //  // whether it has become null|undefined in the meantime.
    //  // As we alter the query's property from it's dependent states, we have to ensure
    //  // that we do not set them if he dependent state does depend on another query with
    //  // the value only being available because it is still retained.
    //  if (!isAnyDependentStateClear()) {
    //    let outQuery = new QueryResource(_.pick(query.$source, '_links'));
    //    outQuery.id = query.id;
    //    outQuery.sortBy = _.cloneDeep(sortBy.currentSortBys);
    //    outQuery.groupBy = _.cloneDeep(groupBy.current);
    //    outQuery.filters = _.cloneDeep(filters.current);
    //    outQuery.columns = _.cloneDeep(columns.current);
    //    outQuery.sums = _.cloneDeep(sums.current);

    //    //states.query.out.put(outQuery);
    //  }
    //});

    //Observable.combineLatest(
    //  states.query.out.observeOnScope($scope),
    //  //wpTablePagination.observeOnScope($scope)
    //).subscribe(([query]) => { //([query, pagination]) => {

    //  //TODO: place where it belongs
    //  let outQuery = query;
    //  let inQuery = states.table.query.getCurrentValue();

    //  let pagination = wpTablePagination.current;

    //  let outQueryChecksum = urlParamsForStates(outQuery as QueryResource, pagination);
    //  let inQueryChecksum = urlParamsForStates(inQuery as QueryResource, pagination);

    //  //if ($scope.queryChecksum) {
    //  if (outQueryChecksum != inQueryChecksum) {
    //    $scope.maintainUrlQueryState(outQuery, pagination);
    //    $scope.maintainBackUrl();
    //  }

    //  if (paramsStringWithoutColumns(inQueryChecksum) != paramsStringWithoutColumns(outQueryChecksum)) {
    //    updateResultsVisibly();
    //  }
    //  //}

    // // $scope.queryChecksum = newQueryChecksum;
    //});
    //TODO: move to service
    //Observable.combineLatest(
    //  states.table.query.observeOnScope($scope),
    //  wpTableFilters.observeOnScope($scope),
    //  wpTableColumns.observeOnScope($scope),
    //  wpTableSortBy.observeOnScope($scope),
    //  wpTableGroupBy.observeOnScope($scope),
    //  wpTableSum.observeOnScope($scope)
    //).subscribe(([query, filters, columns, sortBy, groupBy, sums]) => {

    //  // The combineLatest retains the last value of each observable regardless of
    //  // whether it has become null|undefined in the meantime.
    //  // As we alter the query's property from it's dependent states, we have to ensure
    //  // that we do not set them if he dependent state does depend on another query with
    //  // the value only being available because it is still retained.
    //  if (!isAnyDependentStateClear()) {
    //    let outQuery = new QueryResource(_.pick(query.$source, '_links'));
    //    outQuery.id = query.id;
    //    outQuery.sortBy = _.cloneDeep(sortBy.currentSortBys);
    //    outQuery.groupBy = _.cloneDeep(groupBy.current);
    //    outQuery.filters = _.cloneDeep(filters.current);
    //    outQuery.columns = _.cloneDeep(columns.current);
    //    outQuery.sums = _.cloneDeep(sums.current);

    //    states.query.out.put(outQuery);
    //  }
    //});

    //Observable.combineLatest(
    //  states.query.out.observeOnScope($scope),
    //  //wpTablePagination.observeOnScope($scope)
    //).subscribe(([query]) => { //([query, pagination]) => {

    //  //TODO: place where it belongs
    //  let outQuery = query;
    //  let inQuery = states.table.query.getCurrentValue();

    //  let pagination = wpTablePagination.current;

    //  let outQueryChecksum = urlParamsForStates(outQuery as QueryResource, pagination);
    //  let inQueryChecksum = urlParamsForStates(inQuery as QueryResource, pagination);

    //  //if ($scope.queryChecksum) {
    //  if (outQueryChecksum != inQueryChecksum) {
    //    $scope.maintainUrlQueryState(outQuery, pagination);
    //    $scope.maintainBackUrl();
    //  }

    //  if (paramsStringWithoutColumns(inQueryChecksum) != paramsStringWithoutColumns(outQueryChecksum)) {
    //    updateResultsVisibly();
    //  }
    //  //}

    // // $scope.queryChecksum = newQueryChecksum;
    //});
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
    //if (query.id) {
    //  $location.search('query_id', query.id);
    //}
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
      $scope.selectedTitle = query.name;
    } else {
      $scope.selectedTitle = I18n.t('js.label_work_package_plural');
    }
  }

  $scope.$watchCollection(
    () => {
      return {
        query_id: $state.params['query_id'],
        query_props: $state.params['query_props']
      };
    },
    (params:any) => {
      let newQueryChecksum = params.query_props;
      let newQueryId = params.query_id && parseInt(params.query_id);

      if (currentQueryId !== newQueryId ||
         (currentQueryId === newQueryId && (newQueryChecksum && (newQueryChecksum !== currentQueryChecksum))) ||
          currentQueryChecksum && !newQueryChecksum) {
        currentQueryChecksum = newQueryChecksum;
        currentQueryId = newQueryId;

        loadQuery();
      }
    });

  function paramsStringWithoutColumns(paramsString:string) {
    let parsedString = JSON.parse(paramsString);
    delete(parsedString['c'])
    return JSON.stringify(parsedString);
  }

  function isAnyDependentStateClear() {
    return !states.table.pagination.getCurrentValue() ||
           !states.table.filters.getCurrentValue() ||
           !states.table.columns.getCurrentValue() ||
           !states.table.sortBy.getCurrentValue() ||
           !states.table.groupBy.getCurrentValue() ||
           !states.table.sum.getCurrentValue()
  }

  //$rootScope.$on('$stateChangeSuccess', function () {
  //  $scope.maintainUrlQueryState();
  //  $scope.maintainBackUrl();
  //});

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
