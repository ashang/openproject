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

import {QueryDmService} from '../api/api-v3/hal-resource-dms/query-dm.service'
import {QueryResource} from '../api/api-v3/hal-resources/query-resource.service'
import {States} from '../states.service';
import {WorkPackagesListService} from '../wp-list/wp-list.service'
import {ContextMenuService} from '../context-menus/context-menu.service';
import {LoadingIndicatorService} from '../common/loading-indicator/loading-indicator.service';

interface IAutocompleteItem {
  label:string;
  query:QueryResource;
}

interface IQueryAutocompleteJQuery extends JQuery {
  querycomplete({}):void
}

interface MyScope extends ng.IScope {
  loaded:boolean;
  i18n:MyI18n;
}

interface MyI18n {
  loading:string;
  label:string;
}

export class WorkPackageQuerySelectController {

  public queries:QueryResource[];
  public autocompleteValues:IAutocompleteItem[];
  public loadingText = 'Loading';

  constructor(private $scope:MyScope,
              private loadingIndicator:LoadingIndicatorService,
              private QueryDm:QueryDmService,
              private $state:ng.ui.IStateService,
              private states:States,
              private wpListService:WorkPackagesListService,
              private contextMenu:ContextMenuService,
              private I18n:op.I18n) {

    this.$scope.loaded = false;
    this.$scope.i18n = {
      loading: I18n.t('js.ajax.loading'),
      label: I18n.t('js.toolbar.search_query_label')
    };

    this.setup();
  };

  private setup() {
    this.loadQueries().then(collection => {
      this.queries = collection.elements as QueryResource[];

      let sortedQueries = _.reverse(_.sortBy(this.queries, 'public'));
      this.autocompleteValues = _.map(sortedQueries, query => { return { label: query.name, query: query } } );

      this.setupAutoCompletion();

      this.setLoaded();
    });
  }

  private loadQueries() {
    return this.QueryDm.all(this.$state.params['projectPath']);
  }

  private setupAutoCompletion() {
    this.defineJQueryQueryComplete();

    let input = angular.element('#query-title-filter') as IQueryAutocompleteJQuery;

    let close = () => { this.contextMenu.close() }

    input.querycomplete({
      delay: 0,
      source: this.autocompleteValues,
      select: (ul:any, selected:{item:IAutocompleteItem}) => {
        this.loadQuery(selected.item.query);
      },
      appendTo: '.search-query-wrapper',
      classes: {
        'ui-autocomplete': '-inplace'
      },
      close: close
    });
  }

  private defineJQueryQueryComplete() {
    let labelFunction = (isPublic:boolean) => {
      if (isPublic) {
        return this.I18n.t('js.label_global_queries');
      } else {
        return this.I18n.t('js.label_custom_queries');
      }
    }

    jQuery.widget("custom.querycomplete", jQuery.ui.autocomplete, {
      _create: function(this:any) {
        this._super();
        this.widget().menu( "option", "items", "> :not(.ui-autocomplete--category)" );
        this._search('');
      },
      _renderMenu: function(this:any, ul:any, items:IAutocompleteItem[] ) {
        let currentlyPublic:boolean;

        _.each(items, option => {
          var query = option.query;

          if ( query.public !== currentlyPublic ) {
            ul.append( "<li class='ui-autocomplete--category'>" + labelFunction(query.public) + "</li>" );
            currentlyPublic = query.public;
          }
          this._renderItemData( ul, option );
        });
      }
    });
  }

  private loadQuery(query:QueryResource) {
    this.wpListService.reloadQuery(query);
  }

  private setLoaded() {
    this.$scope.loaded = true;
    this.$scope.i18n.loading = '';
  }
}
