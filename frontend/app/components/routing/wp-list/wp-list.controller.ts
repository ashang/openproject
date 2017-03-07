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
import {Observable} from 'rxjs/Observable';
import {LoadingIndicatorService} from '../../common/loading-indicator/loading-indicator.service';
import {WorkPackageTableMetadata} from '../../wp-fast-table/wp-table-metadata';
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
                                    wpNotificationsService:WorkPackageNotificationService,
                                    wpTableColumns:WorkPackageTableColumnsService,
                                    wpTableSortBy:WorkPackageTableSortByService,
                                    wpTableGroupBy:WorkPackageTableGroupByService,
                                    wpTableFilters:WorkPackageTableFiltersService,
                                    WorkPackageService:any,
                                    wpListService:any,
                                    wpCacheService:WorkPackageCacheService,
                                    ProjectService:any,
                                    QueryService:any,
                                    PaginationService:any,
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

  // Setup
  function initialSetup() {
    $scope.disableFilters = false;
    $scope.disableNewWorkPackage = true;
    $scope.queryError = false;

    setupObservers();

    loadQuery();
  }

  function setupObservers() {
    // yield updatable data to scope
    Observable.combineLatest(
      states.table.columns.observeOnScope($scope)//,
//      states.query.availableColumns.observeOnScope($scope)
    ).subscribe(() => {
      $scope.columns = wpTableColumns.getColumns();
    });

    states.table.query.observeOnScope($scope).subscribe(query => {
      $scope.query = query;
      setupPage(query);
    });

    Observable.combineLatest(
      states.table.query.observeOnScope($scope),
      states.table.form.observeOnScope($scope),
    ).subscribe(([query, form]) => {
      let schema = form.schema as QuerySchemaResourceInterface;
      wpTableSortBy.initialize(query, schema);
      wpTableGroupBy.initialize(query, schema);
      wpTableFilters.initialize(query, schema);
    });

    Observable.combineLatest(
      states.table.query.observeOnScope($scope),
      states.table.metadata.observeOnScope($scope),
      wpTableFilters.observeOnScope($scope),
      states.table.columns.observeOnScope($scope),
      wpTableSortBy.observeOnScope($scope),
      wpTableGroupBy.observeOnScope($scope)
    ).subscribe(([query, meta, filters, columns, sortBy, groupBy]) => {

      // TODO: Think about splitting this up (one observer per state) to do less work with copying over the values
      let oldUrl = $scope.backUrl;

      query.sortBy = sortBy.currentSortBys;
      query.groupBy = groupBy.currentGroupBy;
      query.filters = filters.current;

      $scope.maintainUrlQueryState(query, meta);
      $scope.maintainBackUrl();

      if (oldUrl != $scope.backUrl) {
        updateResults();
      }
    });
  }

  function loadQuery() {
    loadingIndicator.table.promise = wpListService.fromQueryParams($state.params, $scope.projectIdentifier)
      .then((query:QueryResource) => {
        updateStatesFromQuery(query)
        return query;
      })
      .then(loadForm);
  }

  function updateStatesFromQuery(query:QueryResource) {
    // Update work package states

    $scope.meta = new WorkPackageTableMetadata(query)

    updateStatesFromWPCollection(query.results);

    states.table.query.put(query);

    states.table.metadata.put(angular.copy($scope.meta));

    // Set current column state
    states.table.columns.put(query.columns);
  }

  function updateStatesFromWPCollection(results:WorkPackageCollectionResource) {
    // TODO: move into appropriate layer, probably into the Dm layer

    if (results.schemas) {
      _.each(results.schemas.elements, (schema:SchemaResource) => {
        states.schemas.get(schema.href as string).put(schema);
      });
    };

    // register data in state
    // TODO: place in DM Layer
    $q.all(results.elements.map(wp => wp.schema.$load())).then(() => {
      states.table.rows.put(results.elements);
    });

    wpCacheService.updateWorkPackageList(results.elements);

    $scope.meta.updateByQueryResults(results);

    states.table.metadata.put(angular.copy($scope.meta));

    states.table.groups.put(angular.copy(results.groups));
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


    states.query.availableColumns.put(schema.columns.allowedValues as QueryColumn[]);
  }

  function loadProject() {
    if ($scope.projectIdentifier) {
      ProjectService.getProject($scope.projectIdentifier).then(function (project:any) {
        $scope.project = project;
        $scope.projects = [project];
      });
    }
  }

  function setupPage(query:QueryResource) {

    $scope.maintainBackUrl();

    // setup table
    setupWorkPackagesTable(query);
  }

  function setupWorkPackagesTable(query:QueryResource) {
    $scope.resource = query;
    $scope.rowcount = query.results.count;

    // Authorisation
    AuthorisationService.initModelAuth('work_package', query.results.$links);
    AuthorisationService.initModelAuth('query', query.$links);
  }

  function urlParamsForStates(query:QueryResource, meta:WorkPackageTableMetadata) {
    return UrlParamsHelper.encodeQueryJsonParams(query, _.pick(meta, ['page', 'pageSize']));
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

  $scope.maintainUrlQueryState = function (query:QueryResource, meta:WorkPackageTableMetadata) {
    $location.search('query_props', urlParamsForStates(query, meta));
  };

  $scope.loadQuery = function (queryId:string) {
    loadingIndicator.table.promise = $state.go('work-packages.list',
      {'query_id': queryId,
       'query_props': null});
  };

  function updateResults() {
    var meta = states.table.metadata.getCurrentValue() as WorkPackageTableMetadata;

    var params = {
      pageSize: meta.pageSize,
      offset: meta.page
    };

    var query = states.table.query.getCurrentValue();

    loadingIndicator.table.promise = wpListService.fromQueryInstance(query, params)
      .then(updateStatesFromWPCollection);
  }

  // Go

  initialSetup();

  $scope.$watch(QueryService.getQueryName, function (queryName:string) {
    $scope.selectedTitle = queryName || I18n.t('js.label_work_package_plural');
  });

  $scope.$watchCollection(function(){
    return {
      query_id: $state.params['query_id'],
      query_props: $state.params['query_props']
    };
  }, function(params:any) {
    var query = states.table.query.getCurrentValue();
    var meta = states.table.metadata.getCurrentValue();

    if (query && meta) {
      var currentStateParams = urlParamsForStates(query, meta);

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
    updateResults();
  });

  //$rootScope.$on('workPackagesRefreshInBackground', function () {
  //  wpListService.fromQueryInstance($scope.query, $scope.projectIdentifier)
  //    .then(function (query) {
  //      $scope.$broadcast('openproject.workPackages.updateResults');
  //      $scope.$evalAsync(() => {
  //        wpCacheService.updateWorkPackageList(json.work_packages);
  //        setupWorkPackagesTable(json);
  //      });
  //    });
  //});

  $rootScope.$on('queryClearRequired', _ => wpListService.clearUrlQueryParams);
}

angular
  .module('openproject.workPackages.controllers')
  .controller('WorkPackagesListController', WorkPackagesListController);
