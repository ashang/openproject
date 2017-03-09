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

import {QueryResource} from '../hal-resources/query-resource.service';
import {opApiModule} from '../../../../angular-modules';
import {HalRequestService} from '../hal-request/hal-request.service';

export class QueryDmService {
  constructor(protected halRequest:HalRequestService,
              protected v3Path:any,
              protected UrlParamsHelper:any) {
  }

  public load(queryData:Object, queryId?:string, projectIdentifier?:string):ng.IPromise<QueryResource> {
    let path:string;

    if (queryId) {
      path = this.v3Path.queries({query: queryId});
    } else {
      path = this.v3Path.queries.default({project: projectIdentifier});
    }

    return this.halRequest.get(path,
                               queryData,
                               {caching: {enabled: false} });
  }

  public loadResults(query:QueryResource, additionalParams:Object):ng.IPromise<QueryResource> {

    var queryData = this.UrlParamsHelper.buildV3GetQueryFromQueryResource(query, additionalParams);

    var url = query.results.href || '';
    url = url.substring(0, url.indexOf('?'))

    return this.halRequest.get(url, queryData, {caching: {enabled: false} });
  }

  public save(query:QueryResource) {
    //TODO
  }
}

opApiModule.service('QueryDm', QueryDmService);
