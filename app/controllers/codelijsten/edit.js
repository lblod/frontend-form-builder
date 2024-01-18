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
import { updateConcept } from '../../utils/codelijsten/update-concept';
import { isConceptArrayChanged } from '../../utils/codelijsten/compare-concept-arrays';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;

  @tracked name;
  @tracked concepts;
  @tracked conceptsToDelete;
  @tracked isDeleteModalOpen;
  @tracked isDuplicateName;
  @tracked nameErrorMessage;
  @tracked isSaveDisabled;

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

    this.setIsSaveButtonDisabled();
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

    this.setIsSaveButtonDisabled();
  }

  @action
  handleConceptChange(concept, event) {
    if (event.target && event.target.value.trim() == '') {
      showErrorToasterMessage(
        this.toaster,
        `Optie mag niet leeg zijn (${concept.label})`
      );
    }

    const foundConcept = this.concepts.find((c) => c.id == concept.id);
    this.concepts[this.concepts.indexOf(foundConcept)].label =
      event.target.value.trim();

    this.setIsSaveButtonDisabled();
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

    this.setIsSaveButtonDisabled();
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
    this.conceptsToDelete = [];

    await this.updateConcepts();
    this.router.transitionTo('codelijsten.index');
  }

  async updateConcepts() {
    await this.removeEmptyConceptsAndScheme();

    for (const concept of this.concepts) {
      await updateConcept(concept, this.store, this.toaster);
    }
  }

  @action
  temporaryDeleteConcept(concept) {
    const conceptToDelete = this.concepts.find((con) => con.id == concept.id);
    if (conceptToDelete) {
      this.concepts.removeObject(conceptToDelete);
      this.conceptsToDelete.push(conceptToDelete);
    }
    this.setIsSaveButtonDisabled();
  }

  async removeEmptyConceptsAndScheme() {
    const emptyConcepts = this.concepts.filter(
      (concept) => concept.label.trim() == ''
    );

    await this.deleteConcepts(emptyConcepts, true);

    if (this.model.conceptScheme.label.trim() == '') {
      await this.deleteCodelist();
    }

    this.concepts = this.concepts.filter(
      (concept) => concept.label.trim() !== ''
    );
  }

  async deleteConcepts(concepts, deleteSilently) {
    if (!concepts || concepts.length == 0) {
      return true;
    }

    for (const conceptToDelete of concepts) {
      await deleteConcept(
        conceptToDelete.id,
        this.store,
        this.toaster,
        deleteSilently
      );
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

  setIsSaveButtonDisabled() {
    if (this.model.conceptScheme.isPublic) {
      if (this.isBackTheSavedVersion()) {
        this.isSaveDisabled = true;
        return;
      }
      if (
        this.isValidConceptSchemeName() &&
        this.isConceptListIncludingEmptyValues()
      ) {
        if (
          this.model.conceptScheme.label.trim() !== this.name ||
          isConceptArrayChanged(this.model.concepts, this.concepts) ||
          this.conceptsToDelete.length >= 1
        ) {
          this.isSaveDisabled = false;
        } else {
          this.isSaveDisabled = true;
        }
      } else {
        this.isSaveDisabled = true;
      }
    } else {
      this.isSaveDisabled = true;
    }
  }

  isConceptListIncludingEmptyValues() {
    return this.concepts.every((concept) => concept.label.trim() !== '');
  }

  isValidConceptSchemeName() {
    return this.name.trim() !== '' && !this.isDuplicateName;
  }

  isBackTheSavedVersion() {
    return (
      this.model.conceptScheme.label == this.name &&
      !isConceptArrayChanged(this.model.concepts, this.concepts)
    );
  }
}
