//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2017 the OpenProject Foundation (OPF)
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

import {States} from '../../states.service';
import {opServicesModule} from '../../../angular-modules';
import {State} from '../../../helpers/reactive-fassade';
import {WorkPackageCollectionResource} from '../../api/api-v3/hal-resources/wp-collection-resource.service'
import {
  QueryResource
} from '../../api/api-v3/hal-resources/query-resource.service';
import {WorkPackageTableBaseService} from './wp-table-base.service';
import {WorkPackageTablePagination} from '../wp-table-pagination';

interface PaginationUpdateObject {
  page?:number;
  perPage?:number;
  total?:number;
  count?:number;
}

export class WorkPackageTablePaginationService {
  protected state:State<WorkPackageTablePagination>;

  constructor(public states: States) {
    "ngInject";

    this.state = states.table.pagination;
  }

  public initialize(query:QueryResource) {
    //let state = this.create(query, schema);

    let state = new WorkPackageTablePagination(query)
    this.state.put(state);
  }

//  public update(page:number, perPage?:number) {
//    let currentState = this.current;
//
//    currentState.update(page, perPage);
//
//    this.state.put(currentState);
//  }

  public updateFromObject(object:PaginationUpdateObject) {
    let currentState = this.current;

    if (object.page) {
      currentState.page = object.page;
    }
    if (object.perPage) {
      currentState.perPage = object.perPage;
    }
    if (object.total) {
      currentState.total = object.total;
    }
    if (object.count) {
      currentState.count = object.count;
    }

    this.state.put(currentState);
  }

  public updateFromResults(results:WorkPackageCollectionResource) {
    let update = { page: results.offset,
                   perPage: results.pageSize,
                   total: results.total,
                   count: results.count }

    this.updateFromObject(update);
  }

  public get current():WorkPackageTablePagination {
    return this.state.getCurrentValue()!;
  }

  public observeOnScope(scope:ng.IScope) {
    return this.state.observeOnScope(scope);
  }

  public onReady(scope:ng.IScope, fields?:Array<string>) {
    return this.state.observeOnScope(scope).take(1).mapTo(null).toPromise();
  }
}


opServicesModule.service('wpTablePagination', WorkPackageTablePaginationService);
