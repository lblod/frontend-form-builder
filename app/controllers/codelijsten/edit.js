import Controller from '@ember/controller';

import { action } from '@ember/object';
import { A } from '@ember/array';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { NAME_INPUT_CHAR_LIMIT } from '../../utils/constants';
import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../../utils/toaster-message-helper';
import { deleteConcept } from '../../utils/codelijsten/delete-concept';
import { deleteConceptScheme } from '../../utils/codelijsten/delete-concept-scheme';
import { isDuplicateConceptSchemeName } from '../../utils/codelijsten/is-duplicate-concept-scheme-name';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;

  @tracked name;
  @tracked concepts;
  @tracked conceptsToDelete;
  @tracked isConceptListUnchanged;
  @tracked isDeleteModalOpen;
  @tracked isDuplicateName;
  @tracked nameErrorMessage;

  @action
  setup(model) {
    this.name = model.conceptScheme.label;
    this.conceptsToDelete = [];
    this.concepts = A(
      new Array(...model.concepts).map((concept) => {
        return {
          id: concept.id,
          label: concept.label,
        };
      })
    );
    this.isConceptListUnchanged = true;
    this.isDuplicateName = false;
  }

  get isSaveDisabled() {
    return (
      this.isPrivateConceptScheme ||
      this.isDuplicateName ||
      this.name.length > NAME_INPUT_CHAR_LIMIT ||
      (this.model.conceptScheme.label.trim() == this.name.trim() &&
        this.isConceptListUnchanged)
    );
  }

  get isPrivateConceptScheme() {
    return !this.model.conceptScheme.isPublic;
  }

  @action
  async handleNameChange(event) {
    const newName = event.target.value;
    this.nameErrorMessage = null;

    if (!newName || newName.trim() == '') {
      this.nameErrorMessage = 'Dit veld is verplicht';
    }

    this.name = newName.trim();
    this.isDuplicateName = await isDuplicateConceptSchemeName(
      this.model.conceptScheme,
      this.name,
      this.store
    );

    if (this.name !== '' && this.isDuplicateName) {
      this.nameErrorMessage = `Naam is duplicaat`;
    }

    if (this.name.length > NAME_INPUT_CHAR_LIMIT) {
      this.nameErrorMessage = 'Maximum characters exceeded';
    }
  }

  @action
  handleConceptChange(concept, event) {
    if (event.target && event.target.value.trim() == '') {
      showErrorToasterMessage(
        this.toaster,
        `Optie mag niet leeg zijn (${concept.label})`
      );
      return;
    }

    const foundConcept = this.concepts.find((c) => c.id == concept.id);
    this.concepts[this.concepts.indexOf(foundConcept)].label =
      event.target.value.trim();

    this.isConceptListUnchanged = !this.isConceptListChanged();
  }

  @action
  async addNewConcept() {
    const concept = this.store.createRecord('concept', {
      preflabel: '',
      conceptSchemes: [this.model.conceptScheme],
    });
    await concept.save();
    await concept.reload();
    this.concepts.pushObject({
      id: concept.id,
      label: concept.label,
    });
  }

  @action
  async save() {
    if (this.model.conceptScheme.label.trim() !== this.name) {
      this.model.conceptScheme.preflabel = this.name;
      try {
        this.model.conceptScheme.save();
        this.model.conceptScheme.reload();
        showSuccessToasterMessage(this.toaster, 'Codelijst naam bijgewerkt');
      } catch (error) {
        showErrorToasterMessage(this.toaster, 'Oeps, er is iets mis gegaan');
        console.error(error);
      }
    }

    await this.deleteConcepts(this.conceptsToDelete);

    await this.updateConcepts();
    this.isConceptListUnchanged = true;
  }

  async updateConcepts() {
    for (const concept of this.concepts) {
      let conceptToUpdate = await this.store.findRecord('concept', concept.id);
      if (concept.label.trim() == '') {
        conceptToUpdate.destroyRecord();
      }
      if (
        concept.label.trim() == conceptToUpdate.label ||
        concept.label.trim() == ''
      ) {
        continue;
      }

      conceptToUpdate.preflabel = concept.label;
      try {
        conceptToUpdate.save();
        conceptToUpdate.reload();
        showSuccessToasterMessage(this.toaster, 'Concepten bijgewerkt');
      } catch (error) {
        showErrorToasterMessage(
          this.toaster,
          `Kon concept met id: ${concept.id} niet updaten`
        );
        console.error(error);
      }
    }
  }

  @action
  temporaryDeleteConcept(concept) {
    const conceptToDelete = this.concepts.find((con) => con.id == concept.id);
    if (conceptToDelete) {
      this.concepts.removeObject(conceptToDelete);
      this.conceptsToDelete.push(conceptToDelete);
      this.isConceptListUnchanged = false;
    }
  }

  async removeEmptyConceptsAndScheme() {
    const emptyConcepts = this.concepts.filter(
      (concept) => concept.label.trim() == ''
    );

    await this.deleteConcepts(emptyConcepts);

    if (this.model.conceptScheme.label.trim() == '') {
      await this.deleteCodelist();
    }
  }

  async deleteConcepts(concepts) {
    if (!concepts || concepts.length == 0) {
      return true;
    }

    for (const conceptToDelete of concepts) {
      await deleteConcept(conceptToDelete.id, this.store, this.toaster);
    }
  }

  @action
  async deleteCodelist() {
    await this.deleteConcepts(this.concepts);
    await deleteConceptScheme(
      this.model.conceptScheme.id,
      this.store,
      this.toaster
    );
    this.isDeleteModalOpen = false;
    this.router.transitionTo('codelijsten.index');
  }

  isConceptListChanged() {
    if (this.concepts.length == 0) return false;

    const existingConceptIdsOnScheme = this.model.concepts.map(
      (concept) => concept.id
    );
    const existingConceptLabelsOnScheme = this.model.concepts.map(
      (concept) => concept.label
    );

    for (const concept of this.concepts) {
      if (concept.label.trim() == '') {
        return false;
      }

      if (!existingConceptIdsOnScheme.includes(concept.id)) {
        return true;
      }
      if (!existingConceptLabelsOnScheme.includes(concept.label)) {
        return true;
      }
    }

    return false;
  }
}
