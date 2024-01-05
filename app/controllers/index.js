import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class IndexController extends Controller {
  @service store;
  @service toaster;

  sort = '-created';
  page = 0;
  size = 20;

  formToDelete;

  @tracked showDeleteModal = false;
  @tracked showCreateFormModal = false;

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
        'Formulier: ' + this.formToDelete.label + ' verwijderd',
        'Success',
        {
          timeOut: 5000,
        }
      );
      this.showDeleteModal = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
  }

  @action
  openCreateFormModal() {
    this.showCreateFormModal = true;
  }

  @action
  closeCreateFormModal() {
    this.showCreateFormModal = false;
  }
}
