//-- copyright
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
//++

import {filtersModule} from '../../../angular-modules';
import {States} from '../../states.service';
import {Observable} from 'rxjs/Observable';
import {QueryFilterInstanceSchemaResource} from '../../api/api-v3/hal-resources/query-filter-instance-schema-resource.service'
import {QueryFilterInstanceResource} from '../../api/api-v3/hal-resources/query-filter-instance-resource.service'
import {QueryFilterResource} from '../../api/api-v3/hal-resources/query-filter-resource.service'

function queryFiltersDirective($timeout:ng.ITimeoutService,
                               I18n:op.I18n,
                               states:States,
                               ADD_FILTER_SELECT_INDEX:any) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: '/components/filters/query-filters/query-filters.directive.html',

    compile: function () {
      var localisedFilterName = (filter:any) => {
        if (filter) {
          if (filter.name) {
            return filter.name;
          }

          if (filter.locale_name) {
            return I18n.t('js.filter_labels.' + filter["locale_name"]);
          }
        }

        return '';
      };

      return {
        pre: function (scope:any) {
          scope.I18n = I18n;
          scope.localisedFilterName = localisedFilterName;
          scope.focusElementIndex;
          scope.remainingFilterNames = [];
          scope.remainingFilters = [];

          Observable.combineLatest(
            states.table.query.observeOnScope(scope),
            states.table.form.observeOnScope(scope))
            .subscribe(([query, form]) => {
              scope.query = query;
              scope.form = form;

              loadFilterSchemas();
              updateRemainingFilters();
            })

          //scope.$watch('filterToBeAdded', function (filter:any) {
          //  if (filter) {
          //    scope.query.addFilter(filter.key);
          //    scope.filterToBeAdded = undefined;
          //    var index = scope.query.getActiveFilters().length;
          //    updateFilterFocus(index);
          //    updateRemainingFilters();
          //  }
          //});

          //scope.$watch('query.filters.length', function (len:number) {
          //  if (len >= 0) {
          //    updateRemainingFilters();
          //  }
          //});

          //scope.$watch('query.availableWorkPackageFilters', function (newVal:any, oldVal:any) {
          //  if (newVal !== oldVal) {
          //    updateRemainingFilters();
          //  }
          //});

          scope.deactivateFilter = function (filter:any) {
            var index = scope.query.getActiveFilters().indexOf(filter);

            scope.query.deactivateFilter(filter);

            updateFilterFocus(index);
            updateRemainingFilters();
          };

          function updateRemainingFilters() {
            scope.remainingFilters = getRemainingFilters();
          }

          function getRemainingFilters() {
            var activeFilterHrefs = getActiveFilters().map(filter => filter.href);

            return _.remove(getAvailableFilters(), filter => activeFilterHrefs.indexOf(filter.href) === -1);
          }

          function getAvailableFilters():QueryFilterResource[] {
            return scope.form.schema.filtersSchemas.elements.map((schema:QueryFilterInstanceSchemaResource) => schema.filter.allowedValues[0]);
          }

          function getActiveFilters():QueryFilterResource[] {
            return scope.query.filters.map((filter:QueryFilterInstanceResource) => filter.filter);
          }

          function updateFilterFocus(index:number) {
            var activeFilterCount = scope.query.getActiveFilters().length;

            if (activeFilterCount == 0) {
              scope.focusElementIndex = ADD_FILTER_SELECT_INDEX;
            } else {
              var filterIndex = (index < activeFilterCount) ? index : activeFilterCount - 1;
              var filter = scope.query.getActiveFilters()[filterIndex];

              scope.focusElementIndex = scope.query.filters.indexOf(filter);
            }

            $timeout(function () {
              scope.$broadcast('updateFocus');
            }, 300);
          }

          function loadFilterSchemas() {
            _.each(scope.query.filters, filter => { filter.schema.$load() });
          }
        }
      };
    }
  };
}

filtersModule.directive('queryFilters', queryFiltersDirective);
