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

import {HalResource} from './hal-resource.service';
import {CollectionResource, CollectionResourceInterface, } from './collection-resource.service';
import {WorkPackageCollectionResource, WorkPackageCollectionResourceInterface} from './wp-collection-resource.service';
import {opApiModule} from '../../../../angular-modules';

interface QueryResourceEmbedded {
  results: WorkPackageCollectionResourceInterface;
  columns: QueryColumn[];
  groupBy: HalResource;
}

export class QueryResource extends HalResource {

  public $embedded: QueryResourceEmbedded;
  // TODO check why I need to define those in the interface as well as in the resource
  // when the same is not done for the work package resource
  public results: WorkPackageCollectionResourceInterface;
  public columns: QueryColumn[];
  public groupBy: HalResource;
}

function queryResource(...args) {
  return QueryResource;
}

export interface QueryResourceInterface extends QueryResourceEmbedded, QueryResource {
}

/**
 * A reference to a query column object as returned from the API.
 */
export interface QueryColumn extends HalResource {
  id:string;
  name:string;
  _links?: {
    self: { href:string, title:string };
  }
}

opApiModule.factory('QueryResource', queryResource);
