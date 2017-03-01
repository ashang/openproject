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
import {QueryFilterInstanceResource} from '../../api/api-v3/hal-resources/query-filter-instance-resource.service'

export class QueryFilterService {
  constructor(protected $q:ng.IQService) {
  }

  public prepare(filter:QueryFilterInstanceResource):ng.IPromise<{}> {
    let deferred = this.$q.defer();

    let promises = [filter.schema.$load()]

    promises[0].then(() => {
      if (filter.values.length && filter.currentSchema && filter.currentSchema.values && filter.currentSchema.values.allowedValues) {
        if (filter.currentSchema.values.allowedValues.$load) {
          filter.currentSchema.values.allowedValues.$load().then((options:HalResource) => {
            _.each(filter.values, (value:any, index:number) => {
              filter.values[index] = _.find(options.elements, option => option.$href === value.$href);
            })
            deferred.resolve();
          });

        }
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  }
}

filtersModule.service('queryFilterService', QueryFilterService);
