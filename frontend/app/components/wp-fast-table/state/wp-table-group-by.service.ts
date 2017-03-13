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

import {
  QueryResource,
  QueryColumn
} from '../../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';
import {QueryGroupByResource} from '../../api/api-v3/hal-resources/query-group-by-resource.service';
import {opServicesModule} from '../../../angular-modules';
import {States} from '../../states.service';
import {State} from '../../../helpers/reactive-fassade';
import {WorkPackageTableGroupBy} from '../wp-table-group-by';
import {WorkPackageTableBaseService} from './wp-table-base.service';

export class WorkPackageTableGroupByService extends WorkPackageTableBaseService {
  protected state:State<WorkPackageTableGroupBy>;

  constructor(public states: States) {
    "ngInject";
    super();

    this.state = states.table.groupBy;
  }

  protected create(query:QueryResource, schema:QuerySchemaResourceInterface) {
    return new WorkPackageTableGroupBy(query, schema)
  }

  public isGroupable(column:QueryColumn):boolean {
    return !!this.current.isGroupable(column);
  }

  public set(groupBy:QueryGroupByResource) {
    let currentState = this.current;

    currentState.current = groupBy;

    this.state.put(currentState);
  }

  public setBy(column:QueryColumn) {
    let currentState = this.current;

    currentState.setBy(column);

    this.state.put(currentState);
  }

  protected get current():WorkPackageTableGroupBy {
    return this.state.getCurrentValue() as WorkPackageTableGroupBy;
  }

  public get currentGroupBy():QueryGroupByResource|undefined {
    if (this.current) {
      return this.current.current;
    } else {
      return undefined;
    }
  }

  public get availableGroupBys():QueryGroupByResource[] {
    return this.current.available;
  }

  public isCurrentlyGroupedBy(column:QueryColumn):boolean {
    return this.current.isCurrentlyGroupedBy(column);
  }

  public observeOnScope(scope:ng.IScope) {
    return this.state.observeOnScope(scope);
  }

  public onReady(scope:ng.IScope) {
    return this.state.observeOnScope(scope).take(1).mapTo(null).toPromise();
  }
}

opServicesModule.service('wpTableGroupBy', WorkPackageTableGroupByService);
