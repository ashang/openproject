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

import {QueryColumn} from '../../api/api-v3/hal-resources/query-resource.service';
import {QueryResource} from '../../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';
import {
  QuerySortByResource,
  QUERY_SORT_BY_ASC,
  QUERY_SORT_BY_DESC
} from '../../api/api-v3/hal-resources/query-sort-by-resource.service';
import {opServicesModule} from '../../../angular-modules';
import {States} from '../../states.service';
import {State} from '../../../helpers/reactive-fassade';
import {WorkPackageTableSortBy} from '../wp-table-sort-by';

export class WorkPackageTableSortByService {
  private state:State<WorkPackageTableSortBy>;

  constructor(public states: States) {
    "ngInject";
    this.state = states.table.sortBy;
  }

  public changeQuery(query:QueryResource) {
    let sortBy = this.current || new WorkPackageTableSortBy();

    sortBy.updateFromQuery(query);

    this.state.put(sortBy);
  }

  public changeSchema(schema:QuerySchemaResourceInterface) {
    let sortBy = this.current || new WorkPackageTableSortBy();

    sortBy.updateFromSchema(schema);

    this.state.put(sortBy);
  }

  public isSortable(column:QueryColumn):boolean {
    return !!this.findAnyAvailable(column);
  }

  public addAscending(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_ASC);

    if (available) {
      this.add(available);
    }
  }

  public addDescending(column:QueryColumn) {
    let available = this.findAvailableDirection(column, QUERY_SORT_BY_DESC);

    if (available) {
      this.add(available);
    }
  }

  public add(sortBy:QuerySortByResource) {
    let currentState = this.current;

    currentState.currentSortBys.unshift(sortBy);

    currentState.currentSortBys = currentState.currentSortBys.slice(0, 3);

    this.state.put(currentState);
  }

  private get current():WorkPackageTableSortBy {
    return this.state.getCurrentValue() as WorkPackageTableSortBy;
  }

  private findAnyAvailable(column:QueryColumn):QuerySortByResource|null {
    return _.find(this.current.availableSortBys,
                  (candidate) => candidate.column.$href === column.$href) || null;
  }

  private findAvailableDirection(column:QueryColumn, direction:string):QuerySortByResource|null {
    return _.find(this.current.availableSortBys,
                  (candidate) => (candidate.column.$href === column.$href &&
                                  candidate.direction.$href === direction)) || null;
  }
}

opServicesModule.service('wpTableSortBy', WorkPackageTableSortByService);
