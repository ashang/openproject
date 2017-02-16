//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2017 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2017 Jean-Philippe Lang
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

module.exports = function(I18n, PaginationService, PathHelper) {
  var UrlParamsHelper = {
    // copied more or less from angular buildUrl
    buildQueryString: function(params) {
      if (!params) return;

      var parts = [];
      angular.forEach(params, function(value, key) {
        if (!value) return;
        if (!Array.isArray(value)) value = [value];

        angular.forEach(value, function(v) {
          if (v !== null && typeof v === 'object') {
            v = toJson(v);
          }
          parts.push(encodeURIComponent(key) + '=' +
                     encodeURIComponent(v));
        });
      });

      return parts.join('&');
    },

    encodeQueryJsonParams: function(query) {
      var paramsData = {
        c: query.columns.map(function(column) { return column.id; })
      };
      if(!!query.sums) {
        paramsData.s = query.sums;
      }

      if(query.project) {
        paramsData.p = query.project.id;
      }
      if(query.groupBy) {
        paramsData.g = query.groupBy;
      }
      if(query.getSortation()) {
        paramsData.t = query.getSortation().encode();
      }
      if(query.filters && query.filters.length) {
        paramsData.f = query.filters.filter(function(filter) {
          return !filter.deactivated;
        })
        .map(function(filter) {
          return {
            n: filter.name,
            o: encodeURIComponent(filter.operator),
            t: filter.type,
            v: filter.getValuesAsArray()
          };
        });
      }
      paramsData.pa = PaginationService.getPage();
      paramsData.pp = PaginationService.getPerPage();

      return JSON.stringify(paramsData);
    },

    decodeQueryFromJsonParams: function(queryId, updateJson) {
      var queryData = {};
      if(queryId) {
        queryData.id = queryId;
      }

      if(updateJson) {
        var properties = JSON.parse(updateJson);

        if(properties.c) {
          queryData.columns = properties.c.map(function(column) { return { name: column }; });
        }
        if(!!properties.s) {
          queryData.displaySums = properties.s;
        }
        if(properties.p) {
          queryData.projectId = properties.p;
        }
        if(properties.g) {
          queryData.groupBy = properties.g;
        }

        // Filters
        if(properties.f) {
          queryData.filters = properties.f.map(function(urlFilter) {
            var filterData = {
              name: urlFilter.n,
              operator: decodeURIComponent(urlFilter.o),
              type: urlFilter.t
            };
            if(urlFilter.v) {
              var vs = Array.isArray(urlFilter.v) ? urlFilter.v : [urlFilter.v];
              angular.extend(filterData, { values: vs });
            }
            return filterData;
          });
        }

        // Sortation
        if(properties.t) {
          queryData.sortCriteria = properties.t;
        }

        // Pagination
        if(properties.pa) {
          queryData.page = properties.pa;
        }
        if(properties.pp) {
          queryData.perPage = properties.pp;
        }
      }

      return queryData;
    },

    buildV3GetQueryFromJsonParams: function(updateJson) {
      var queryData = {};

      var properties = JSON.parse(updateJson);

      if(properties.c) {
        queryData["columns[]"] = properties.c.map(function(column) { return column; });
      }
      if(!!properties.s) {
        queryData.displaySums = properties.s;
      }
      if(properties.p) {
        queryData.projectId = properties.p;
      }
      if(properties.g) {
        queryData.groupBy = properties.g;
      }

      // Filters
      if(properties.f) {
        var filters = properties.f.map(function(urlFilter) {
          var attributes =  {
            operator: decodeURIComponent(urlFilter.o),
          }
          if(urlFilter.v) {
            var vs = Array.isArray(urlFilter.v) ? urlFilter.v : [urlFilter.v];
            angular.extend(attributes, { values: vs });
          }
          filterData = {};
          filterData[urlFilter.n] = attributes;

          return filterData;
        });

        queryData.filters = JSON.stringify(filters);
      }

      // Sortation
      if(properties.t) {
        queryData.sortCriteria = properties.t;
      }

      // Pagination
      if(properties.pa) {
        queryData.offset = properties.pa;
      }
      if(properties.pp) {
        queryData.pageSize = properties.pp;
      }

      return queryData;
    },

    buildV3GetQueryFromQueryResource: function(query, additionalParams) {
      var queryData = {};

      queryData["columns[]"] = query.columns.map(function(column) { return column.id; });

      queryData.displaySums = query.sums;

      //queryData.groupBy = query.groupBy.id;

      // Filters
      //filters = query.filters.map(function(filter) {
      //    var attributes =  {
      //      operator: filter(urlFilter.o),
      //    }
      //    if(urlFilter.v) {
      //      var vs = Array.isArray(urlFilter.v) ? urlFilter.v : [urlFilter.v];
      //      angular.extend(attributes, { values: vs });
      //    }
      //    filterData = {};
      //    filterData[urlFilter.n] = attributes;

      //    return filterData;
      //  });
      //}

      //queryData.filters = JSON.stringify(filters);

      // Sortation
      //if(properties.t) {
      //  queryData.sortCriteria = properties.t;
      //}

      // Pagination
      //if(additionalParams.pa) {
      //  queryData.offset = properties.pa;
      //}
      //if(properties.pp) {
      //  queryData.pageSize = properties.pp;
      //}

      return angular.extend(queryData, additionalParams);
    },

    buildQueryExportOptions: function(query){
      var relativeUrl;

      if (query.projectId) {
        relativeUrl = PathHelper.projectWorkPackagesPath(query.projectId);
      } else {
        relativeUrl = PathHelper.workPackagesPath();
      }

      return query.exportFormats.map(function(format){
        var url = relativeUrl + "." + format.format + "?" + "set_filter=1";
        if(format.flags){
          angular.forEach(format.flags, function(flag){
            url = url + "&" + flag + "=" + "true";
          });
        }
        url = url + "&" + query.getQueryString();

        return {
          identifier: format.identifier,
          label: I18n.t('js.' + format.label_locale),
          format: format.format,
          url: url
        };
      });
    }
  };

  return UrlParamsHelper;
};
