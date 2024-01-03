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
  openDeleteModal(generatedForm) {
    this.selectedForm = generatedForm;
    this.showDeleteModal = true;
  }

  @action
  async deleteForm() {
    try {
      await this.selectedForm.destroyRecord();
      this.toaster.success(
        'Formulier: ' + this.selectedForm.label + ' verwijderd',
        'Success',
        {
          timeOut: 5000,
        }
      );
      this.showEditModal = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
  }
}
