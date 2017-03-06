import {WorkPackageTableMetadata} from '../wp-table-metadata';
import {States} from '../../states.service';
import {opServicesModule} from '../../../angular-modules';
import {State} from '../../../helpers/reactive-fassade';
import {WPTableRowSelectionState} from '../wp-table.interfaces';

export class WorkPackageTableMetadataService {

  // The current table metadata state
  public metadata:State<WorkPackageTableMetadata>;

  constructor(public states: States) {
    "ngInject";
    this.metadata = states.table.metadata;
  }

  public showSums():boolean {
    return !!this.current.totalSums;
  }

  /**
   * Get current selection state.
   * @returns {WPTableRowSelectionState}
   */
  public get current():WorkPackageTableMetadata {
    return this.metadata.getCurrentValue() as WorkPackageTableMetadata;
  }
}

opServicesModule.service('wpTableMetadata', WorkPackageTableMetadataService);
