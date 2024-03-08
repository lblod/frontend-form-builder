import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { restartableTask, timeout } from 'ember-concurrency';

export default class IndexController extends Controller {
  @service store;
  @service toaster;
  @service intl;

  sort = '-modified';
  page = 0;
  size = 20;

  formToDelete;

  @tracked showDeleteModal = false;
  @tracked filter;

  @action
  openDeleteModal(generatedForm) {
    this.formToDelete = generatedForm;
    this.showDeleteModal = true;
  }

  @action
  async deleteForm() {
    try {
      await this.formToDelete.destroyRecord();
      this.toaster.success(
        this.intl.t('messages.success.formDeleted', {
          name: this.formToDelete.label,
        }),
        this.intl.t('messages.subjects.deleted'),
        {
          timeOut: 5000,
        }
      );
      this.showDeleteModal = false;
    } catch (err) {
      this.toaster.error(
        this.intl.t('messages.error.somethingWentWrong'),
        this.intl.t('messages.subjects.error'),
        {
          timeOut: 5000,
        }
      );
      console.error(err);
    }
  }

  searchForm = restartableTask(async (event) => {
    await timeout(400);
    const inputvalue = event.target.value;
    if (!inputvalue) {
      this.filter = null;

      return;
    }

    this.filter = inputvalue;
  });

  get translations() {
    return {
      test: this.intl.t('table.columns.test'),
      deleteForm: this.intl.t('crud.delete'),
      noFormsFound: this.intl.t('messages.feedback.noFormsFound'),
      columnName: this.intl.t('table.columns.name'),
      columnModifiedOn: this.intl.t('table.columns.modifiedOn'),
    };
  }
}
