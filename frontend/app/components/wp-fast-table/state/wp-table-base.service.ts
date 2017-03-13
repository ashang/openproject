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

//import {QueryColumn} from '../../api/api-v3/hal-resources/query-resource.service';
//import {QueryResource} from '../../api/api-v3/hal-resources/query-resource.service';
//import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';
//import {
//  QuerySortByResource,
//  QUERY_SORT_BY_ASC,
//  QUERY_SORT_BY_DESC
//} from '../../api/api-v3/hal-resources/query-sort-by-resource.service';
//import {opServicesModule} from '../../../angular-modules';
//import {States} from '../../states.service';
import {State} from '../../../helpers/reactive-fassade';
import {WorkPackageTableBaseInterface} from '../wp-table-base';
import {QueryResource} from '../../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../../api/api-v3/hal-resources/query-schema-resource.service';

export abstract class WorkPackageTableBaseService {
  protected state:State<any>;

  public initialize(query:QueryResource, schema?:QuerySchemaResourceInterface) {
    let state = this.create(query, schema);

    this.state.put(state);
  }

  protected abstract create(query:QueryResource, schema?:QuerySchemaResourceInterface):WorkPackageTableBaseInterface

  public update(query:QueryResource|null, schema?:QuerySchemaResourceInterface) {
    let currentState = this.current;

    currentState.update(query, schema);

    this.state.put(currentState);
  }

  protected get current():WorkPackageTableBaseInterface {
    return this.state.getCurrentValue()!;
  }

  public observeOnScope(scope:ng.IScope) {
    return this.state.observeOnScope(scope);
  }

  public onReady(scope:ng.IScope, fields?:Array<string>) {
    return this.state.observeOnScope(scope).take(1).mapTo(null).toPromise();
  }
}
