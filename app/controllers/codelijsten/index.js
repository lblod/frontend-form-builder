import Controller from '@ember/controller';
import { service } from '@ember/service';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class CodelijstenController extends Controller {
  @service features;
  @service router;
  @service intl;

  @tracked filter;

  size = 20;

  @action
  routeToFormWithId() {
    if (this.formId) {
      this.router.transitionTo('formbuilder.edit', this.formId);
    } else {
      this.router.transitionTo('index');
    }
  }

  @action
  searchCodelist(event) {
    const inputvalue = event.target.value;
    if (!inputvalue) {
      this.filter = null;

      return;
    }

    this.filter = inputvalue;
  }

  get routeLabel() {
    if (this.formId) {
      return this.intl.t('navigation.backToForm');
    } else {
      return this.intl.t('navigation.backToFormOverview');
    }
  }

  get translations() {
    return {
      publicType: this.intl.t('codelists.types.isPublic'),
      privateType: this.intl.t('codelists.types.isPrivate'),
      archivedType: this.intl.t('codelists.types.isArchived'),
      noCodelistsFound: this.intl.t('messages.feedback.noCodelistsFound'),
      columnName: this.intl.t('table.columns.name'),
      columnId: this.intl.t('table.columns.id'),
    };
  }
}
