import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { inject as service } from '@ember/service';

export default class IndexController extends Controller {
  @service store;
  @service toaster;

  sort = '-created';
  page = 0;
  size = 20;

  selectedForm;

  @tracked showDeleteModal = false;

  @action
  OpenDeleteModal(generatedForm) {
    this.selectedForm = generatedForm;
    this.showDeleteModal = true;
  }

  @action
  async deleteForm() {
    const formToDelete = await this.store.peekRecord(
      'generated-form',
      this.selectedForm.id
    );
    const isDeleted = await formToDelete.destroyRecord();
    if (isDeleted) {
      this.showDeleteModal = false;
      this.toaster.success(
        'Formulier: ' + this.selectedForm.label + ' verwijderd',
        'Success',
        {
          timeOut: 5000,
        }
      );
    }
  }
}
