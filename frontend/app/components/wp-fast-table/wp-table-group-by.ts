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

import {QueryGroupByResource} from '../api/api-v3/hal-resources/query-group-by-resource.service';
import {
  QueryResource,
  QueryColumn
} from '../api/api-v3/hal-resources/query-resource.service';
import {QuerySchemaResourceInterface} from '../api/api-v3/hal-resources/query-schema-resource.service';

export class WorkPackageTableGroupBy {
  public availableGroupBys:QueryGroupByResource[] = [];
  public currentGroupBy:QueryGroupByResource | undefined;

  constructor(query:QueryResource, schema:QuerySchemaResourceInterface) {
    this.currentGroupBy = angular.copy(query.groupBy);
    this.availableGroupBys = angular.copy(schema.groupBy.allowedValues as QueryGroupByResource[]);
  }

  public setBy(column:QueryColumn) {
    let groupBy = _.find(this.availableGroupBys, candidate => candidate.id === column.id)

    this.currentGroupBy = groupBy;
  }

  public isGroupable(column:QueryColumn):boolean {
    return !!_.find(this.availableGroupBys, candidate => candidate.id === column.id)
  }

  public isCurrentlyGroupedBy(column:QueryColumn):boolean {
    return !!this.currentGroupBy && this.currentGroupBy.id === column.id
  }
}
