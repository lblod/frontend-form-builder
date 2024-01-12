import Controller from '@ember/controller';

import { action } from '@ember/object';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;

  @tracked name;
  @tracked concepts;
  @tracked isDeleteModalOpen;
  @tracked nameErrorMessage;

  @action
  setup(model) {
    this.name = model.conceptScheme.label;
    this.concepts = A(new Array(...model.concepts));
  }

  get isSaveDisabled() {
    return !this.model.conceptScheme.isPublic;
  }

  get isPrivateConceptScheme() {
    return !this.model.conceptScheme.isPublic;
  }

  @action
  handleNameChange(event) {
    const newName = event.target.value;
    this.nameErrorMessage = null;
    console.log('handle name', newName);

    if (!newName || newName.trim() == '') {
      this.nameErrorMessage = 'Dit veld is verplicht';
      return;
    }

    this.name = newName.trim();
  }

  @action
  handleConceptChange(concept, event) {
    if (event.target && event.target.value.trim() == '') {
      this.toaster.error(
        `Optie mag niet leeg zijn (${concept.label})`,
        'Error',
        {
          timeOut: 5000,
        }
      );

      return;
    }

    const foundConcept = this.concepts.find((c) => c.id == concept.id);
    this.concepts[this.concepts.indexOf(foundConcept)].preflabel =
      event.target.value.trim();
  }

  @action
  async addNewConcept() {
    const concept = this.store.createRecord('concept', {
      preflabel: '',
    });
    await concept.save();
    this.concepts.pushObject(concept);
  }

  @action
  async save() {
    let conceptScheme = await this.store.findRecord(
      'concept-scheme',
      this.model.conceptScheme.id
    );
    conceptScheme.preflabel = this.name;
    try {
      conceptScheme.save();
      conceptScheme.reload();
      this.toaster.success('Codelijst naam bijgewerkt', 'Success', {
        timeOut: 5000,
      });
    } catch (error) {
      this.toaster.error('Oeps, er is iets mis gegaan', 'Error', {
        timeOut: 5000,
      });
      console.error(error);
    }

    await this.updateConcepts();
  }

  async updateConcepts() {
    for (const concept of this.concepts) {
      let conceptToUpdate = await this.store.findRecord('concept', concept.id);
      if (concept.label.trim() == conceptToUpdate.label) {
        return;
      }

      conceptToUpdate.preflabel = concept.label;
      try {
        conceptToUpdate.save();
        conceptToUpdate.reload();
      } catch (error) {
        this.toaster.error(
          `Kon concept met id: ${concept.id} niet updaten`,
          'Error',
          {
            timeOut: 5000,
          }
        );
        console.error(error);
      }
    }
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
