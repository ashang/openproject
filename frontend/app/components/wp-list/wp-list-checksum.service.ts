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

import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service';
import {WorkPackageTablePagination} from '../wp-fast-table/wp-table-pagination';

export class WorkPackagesListChecksumService {
  constructor(protected UrlParamsHelper:any,
              protected $state:ng.ui.IStateService) {
  }

  public id:number|null;
  public checksum:string|null;
  public visibleChecksum:string|null;

  public executeIfDifferent(query:QueryResource,
                            pagination:WorkPackageTablePagination,
                            callback:Function) {

    let newQueryChecksum = this.getNewChecksum(query, pagination);

    if (this.isIdDifferent(query.id)) {
      this.maintainUrlQueryState(query.id, null)

      this.clear();

    } else if (this.isChecksumDifferent(newQueryChecksum)) {
      this.maintainUrlQueryState(query.id, newQueryChecksum)

      this.visibleChecksum = newQueryChecksum;
    }

    if (this.isChecksumDifferentWithoutColumns(newQueryChecksum)) {
      callback();
    }

    this.set(query.id, newQueryChecksum);
  }

  public executeIfOutdated(newId:number,
                           newChecksum:string,
                           callback:Function) {
    if (this.isOutdated(newId, newChecksum)) {
      this.set(newId, newChecksum);

      callback();
    }
  }

  private set(id:number|null, checksum:string) {
    this.id = id;
    this.checksum = checksum;
  }

  private clear() {
    this.id = null;
    this.checksum = null;
    this.visibleChecksum = null;
  }

  private isIdDifferent(otherId:number|null) {
    return this.id !== otherId;
  }

  private isChecksumDifferent(otherChecksum:string) {
    return this.checksum &&
      otherChecksum !== this.checksum;
  }

  private isChecksumDifferentWithoutColumns(otherChecksum:string) {
    return this.checksum &&
      this.paramsStringWithoutColumns(otherChecksum) !== this.paramsStringWithoutColumns(this.checksum);
  }

  private isOutdated(otherId:number|null, otherChecksum:string|null) {
    return ((this.id || this.checksum) &&
      ((this.id !== otherId) ||
      (this.id === otherId && (otherChecksum && (otherChecksum !== this.checksum))) ||
       (this.checksum && !otherChecksum && this.visibleChecksum)));
  }

  private paramsStringWithoutColumns(paramsString:string) {
    let parsedString = JSON.parse(paramsString);
    delete(parsedString['c'])
    return JSON.stringify(parsedString);
  }

  private getNewChecksum(query:QueryResource, pagination:WorkPackageTablePagination) {
    return this.UrlParamsHelper.encodeQueryJsonParams(query, _.pick(pagination, ['page', 'perPage']));
  }

  private maintainUrlQueryState(id:string|number|null, checksum:string|null) {
    this.$state.go('.', { query_props: checksum, query_id: id }, { notify: false });
  };
}

angular
  .module('openproject.workPackages.services')
  .service('wpListChecksumService', WorkPackagesListChecksumService);
