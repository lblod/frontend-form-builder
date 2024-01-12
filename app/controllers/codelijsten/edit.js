import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;

  @tracked name;
  @tracked concepts;
  @tracked isDeleteModalOpen;

  @action
  setup(model) {
    this.name = model.conceptScheme.label;
    this.concepts = new Array(...model.concepts);
  }

  get isSaveDisabled() {
    return !this.model.conceptScheme.isPublic;
  }

  get isPrivateConceptScheme() {
    return !this.model.conceptScheme.isPublic;
  }

  async deleteConcepts(concepts) {
    if (!concepts || concepts.length == 0) {
      return true;
    }

    let allConceptsRemoved = true;
    for (const conceptToDelete of concepts) {
      try {
        const concept = await this.store.findRecord(
          'concept',
          conceptToDelete.id
        );
        concept.destroyRecord();
      } catch (error) {
        allConceptsRemoved = false;
        this.toaster.error(
          `Kon concept met id ${conceptToDelete.id} niet verwijderen `,
          'Error',
          {
            timeOut: 5000,
          }
        );
        console.error(error);
        continue;
      }
    }

    return allConceptsRemoved;
  }

  @action
  async deleteCodelist() {
    console.log(this.model.conceptScheme);
    try {
      const deletedAllConcepts = await this.deleteConcepts(this.concepts);

      if (deletedAllConcepts) {
        // const conceptScheme = await this.store.findRecord(
        //   'concept-concept-scheme',
        //   this.model.id
        // );
        await this.model.conceptScheme.destroyRecord();
        this.router.transitionTo('codelijsten');

        this.toaster.success(
          'Codelijst: ' + this.name + ' verwijderd',
          'Success',
          {
            timeOut: 5000,
          }
        );
      } else {
        this.toaster.warning(
          'Codelijst: ' + this.name + ' niet verwijderd',
          'Opgelet',
          {
            timeOut: 5000,
          }
        );
      }

      this.isDeleteModalOpen = false;
    } catch (err) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(err);
    }
  }
}
