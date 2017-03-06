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

    encodeQueryJsonParams: function(query, additional) {
      var paramsData = {
        c: query.columns.map(function(column) { return column.id; })
      };
      if(!!query.sums) {
        paramsData.s = query.sums;
      }

      if(query.groupBy) {
        paramsData.g = query.groupBy.id;
      }
      if(query.sortBy) {
        paramsData.t = query
                       .sortBy
                       .map(function(sort) { return sort.id.replace('-', ':') })
                       .join();
      }
      if(query.filters && query.filters.length) {
        paramsData.f = query.filters.filter(function(filter) {
          return !filter.deactivated;
        })
        .map(function(filter) {
          var id = filter.filter.href;
          id = id.substring(id.lastIndexOf('/') + 1, id.length);

          var operator = filter.operator.href
          operator = operator.substring(operator.lastIndexOf('/') + 1, operator.length);

          return {
            n: id,
            o: encodeURIComponent(operator),
            v: _.map(filter.values, UrlParamsHelper.queryFilterValueToParam)
          };
        });
      }
      paramsData.pa = additional.page;
      paramsData.pp = additional.pageSize;

      return JSON.stringify(paramsData);
    },

    buildV3GetQueryFromJsonParams: function(updateJson) {
      var queryData = {};

      if (!updateJson) {
        return queryData;
      }

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
            // the array check is only there for backwards compatibility reasons.
            // Nowadays, it will always be an array;
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
        queryData.sortBy = JSON.stringify(properties.t.split(',').map(function(sort) { return sort.split(':') }));
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

      queryData.groupBy = query.groupBy.id;

      // Filters
      filters = query.filters.map(function(filter) {
        var id = filter.filter.href;
        id = id.substring(id.lastIndexOf('/') + 1, id.length);

        var operator = filter.operator.href
        operator = operator.substring(operator.lastIndexOf('/') + 1, operator.length);

        var values = _.map(filter.values, UrlParamsHelper.queryFilterValueToParam);

        var filterHash = {};

        filterHash[id] = { operator: operator,
                           values: values }

        return filterHash;
      });

      queryData.filters = JSON.stringify(filters);

      // Sortation
      queryData.sortBy = [query
                          .sortBy
                          .map(function(sort) { return sort.id.split('-') })];


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
    },

    queryFilterValueToParam: function(value) {
      if (typeof(value) === 'boolean') {
        return value ? 't': 'f';
      }

      return value.id || value;
    }
  };

  return UrlParamsHelper;
};
