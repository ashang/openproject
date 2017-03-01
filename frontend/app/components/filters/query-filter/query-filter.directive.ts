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

import {filtersModule} from '../../../angular-modules';
import {QueryFilterInstanceResource} from '../../api/api-v3/hal-resources/query-filter-instance-resource.service';
import {QueryFilterInstanceSchemaResource} from '../../api/api-v3/hal-resources/query-filter-instance-schema-resource.service';
import {HalResource} from '../../api/api-v3/hal-resources/hal-resource.service';
import {QueryOperatorResource} from '../../api/api-v3/hal-resources/query-operator-resource.service';
import {States} from '../../states.service';

function queryFilterDirective($animate:any,
                              PaginationService:any,
                              I18n:op.I18n,
                              states:States) {
  var updateResultsJob:any;

  return {
    restrict: 'A',
    scope: true,
    link: function (scope:any, element:ng.IAugmentedJQuery) {
      scope.I18n = I18n;

      scope.filterModelOptions = {
        updateOn: 'default blur',
        debounce: {'default': 400, 'blur': 0}
      };

      scope.filterDateModelOptions = {
        updateOn: 'default change blur',
        debounce: {'default': 400, 'change': 0, 'blur': 0}
      };

      $animate.enabled(false, element);

      //preselectOperator();

      //scope.$on('openproject.workPackages.updateResults', function () {
      //  $timeout.cancel(updateResultsJob);
      //});

      //// Filter updates

      scope.$watchCollection('filter.values', function (values: any, oldValues: any) {
        let valueChanged = !_.isEqual(values, oldValues);

        if (!_.isEqual(values, oldValues)) {
          putStateIfComplete();
        }
      });

      scope.availableOperators = scope.filter.schema.availableOperators;

      scope.$watch('filter.operator', function(operator:QueryOperatorResource) {
        updateScopeVariables();

        putStateIfComplete();
      });

      //function addStandardOptions(options:any) {
      //  if (scope.filter.modelName === 'user') {
      //    options.unshift([I18n.t('js.label_me'), 'me']);
      //  }

      //  return options;
      //}

      function filterChanged(filter:any, oldFilter:any) {
        return filter.operator !== oldFilter.operator || !angular.equals(filter.getValuesAsArray(), oldFilter.getValuesAsArray());
      }

      function valueReset(filter:any, oldFilter:any) {
        return oldFilter.hasValues() && !filter.hasValues();
      }

      function updateScopeVariables() {
        scope.showValuesInput = scope.filter.currentSchema.isValueRequired();
        scope.showValueOptionsAsSelect = scope.filter.currentSchema.isResourceValue();

        if (scope.showValuesInput &&
            scope.showValueOptionsAsSelect) {
          if (scope.filter.currentSchema.values.allowedValues.$load) {
            scope.filter.currentSchema.values.allowedValues.$load()
        //    .then(addStandardOptions)
            .then(function (options:any) {
              scope.availableFilterValueOptions = options.elements;
            });
          } else {
            scope.availableFilterValueOptions = scope.filter.currentSchema.values.allowedValues;
          }
        }
      }

      function putStateIfComplete() {
        if (isFilterComplete()) {
          states.table.filters.put(scope.query.filters);
        }
      }

      function isFilterComplete() {
        return scope.filter.values.length || !scope.filter.currentSchema.isValueRequired();
      }

      //function preselectOperator() {
      //  if (!scope.filter.operator) {
      //    var operator:any = _.find(
      //      scope.operatorsAndLabelsByFilterType[scope.filter.type],
      //      function (operator:any) {
      //        return OPERATORS_NOT_REQUIRING_VALUES.indexOf(operator['symbol']) === -1;
      //      }
      //    );
      //    scope.filter.operator = operator ? operator['symbol'] : undefined;
      //  }
      //}
    }
  };
}

filtersModule.directive('queryFilter', queryFilterDirective);
