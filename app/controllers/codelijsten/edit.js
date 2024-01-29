import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import {
  DESCRIPTION_INPUT_CHAR_LIMIT,
  NAME_INPUT_CHAR_LIMIT,
} from '../../utils/constants';
import {
  showErrorToasterMessage,
  showSuccessToasterMessage,
} from '../../utils/toaster-message-helper';
import { deleteConcept } from '../../utils/codelijsten/delete-concept';
import { deleteConceptScheme } from '../../utils/codelijsten/delete-concept-scheme';
import { isDuplicateConceptSchemeName } from '../../utils/codelijsten/is-duplicate-concept-scheme-name';
import { updateConcept } from '../../utils/codelijsten/update-concept';
import { isConceptArrayChanged } from '../../utils/codelijsten/compare-concept-arrays';
import { restartableTask } from 'ember-concurrency';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;
  @service intl;

  @tracked codelistName;
  @tracked codelistDescription;
  @tracked conceptScheme;
  @tracked concepts;
  @tracked conceptsToDelete;

  @tracked nameErrorMessage;
  @tracked descriptionErrorMessage;

  @tracked isDeleteModalOpen;
  @tracked isDuplicateName;
  @tracked isSaveDisabled;
  @tracked isPrivateConceptScheme;

  conceptsInDatabase;

  setup = restartableTask(async (conceptSchemeId) => {
    this.conceptScheme = await this.getConceptSchemeById(conceptSchemeId);
    this.setValuesFromConceptscheme();

    const conceptArray = new Array(...(await this.conceptScheme.concepts));
    this.setValuesFromConcepts(conceptArray);

    this.setIsSaveButtonDisabled();
  });

  setValuesFromConceptscheme() {
    this.isPrivateConceptScheme = !this.conceptScheme.isPublic;
    this.codelistName = this.conceptScheme.label;
    this.codelistDescription = this.conceptScheme.description;
  }

  setValuesFromConcepts(conceptArray) {
    this.conceptsInDatabase = this.mapConceptModels(conceptArray);
    const mappedConcepts = this.mapConceptModels(conceptArray);
    this.concepts = sortObjectsOnProperty(mappedConcepts, 'label');

    this.conceptsToDelete = [];
  }

  @action
  handleDescriptionChange(event) {
    const newDescription = event.target.value;
    this.descriptionErrorMessage = null;

    if (!newDescription || newDescription.trim() == '') {
      this.descriptionErrorMessage = this.intl.t('constraints.mandatoryField');
    }

    this.codelistDescription = newDescription.trim();

    if (this.codelistDescription.length > DESCRIPTION_INPUT_CHAR_LIMIT) {
      this.descriptionErrorMessage = this.intl.t(
        'constraints.maxCharactersReachedWithCount'
      );
    }

    this.setIsSaveButtonDisabled();
  }

  @action
  async handleNameChange(event) {
    const newName = event.target.value;
    this.nameErrorMessage = null;

    if (!newName || newName.trim() == '') {
      this.nameErrorMessage = this.intl.t('constraints.mandatoryField');
    }

    this.codelistName = newName.trim();
    this.isDuplicateName = await isDuplicateConceptSchemeName(
      this.conceptScheme,
      this.codelistName,
      this.store
    );

    if (this.codelistName !== '' && this.isDuplicateName) {
      this.nameErrorMessage = this.intl.t('constraints.duplicateName');
    }

    if (this.codelistName.length > NAME_INPUT_CHAR_LIMIT) {
      this.nameErrorMessage = this.descriptionErrorMessage = this.intl.t(
        'constraints.maconstraints.maxCharactersReached'
      );
    }

    this.setIsSaveButtonDisabled();
  }

  @action
  handleConceptChange(concept, event) {
    if (event.target && event.target.value.trim() == '') {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('constraints.optionCannotBeEmpty', { label: concept.label })
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
      conceptSchemes: [this.conceptScheme],
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
    if (
      this.isCodelistNameDeviating() ||
      this.isCodelistDescriptionDeviating()
    ) {
      this.conceptScheme.preflabel = this.codelistName;
      this.conceptScheme.description = this.codelistDescription;

      try {
        this.conceptScheme.save();
        this.conceptScheme.reload();
        showSuccessToasterMessage(
          this.toaster,
          this.intl.t('messages.success.codelistUpdated')
        );
      } catch (error) {
        showErrorToasterMessage(
          this.toaster,
          this.intl.t('messages.error.somethingWentWrong')
        );
        console.error(error);
      }
    }

    await this.deleteConcepts(this.conceptsToDelete);
    this.conceptsToDelete = [];

    if (this.isConceptListChanged()) {
      await this.updateConcepts();
    }

    await this.setup.perform(this.conceptScheme.id);

    this.setIsSaveButtonDisabled();
  }

  async updateConcepts() {
    await this.removeEmptyConceptsAndScheme();

    for (const concept of this.concepts) {
      await updateConcept(concept, this.store, this.toaster);
    }

    showSuccessToasterMessage(
      this.toaster,
      this.intl.t('messages.subjects.upToDate'),
      this.intl.t('messages.success.conceptsUpdated')
    );
  }

  @action
  async temporaryDeleteConcept(concept) {
    const conceptToDelete = this.concepts.find((con) => con.id == concept.id);

    if (conceptToDelete) {
      this.concepts.removeObject(conceptToDelete);

      if (!this.conceptsInDatabase.find((con) => con.id == concept.id)) {
        await deleteConcept(concept.id, this.store, this.toaster, true);
      } else {
        this.conceptsToDelete.push(conceptToDelete);
      }
    }

    this.setIsSaveButtonDisabled();
  }

  async removeEmptyConceptsAndScheme() {
    const emptyConcepts = this.concepts.filter(
      (concept) => !concept.label || concept.label.trim() == ''
    );

    await this.deleteConcepts(emptyConcepts, true);

    if (this.conceptScheme.label.trim() == '') {
      await this.deleteCodelist();
    }
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
      this.concepts.removeObject(conceptToDelete);
    }
  }

  @action
  async deleteCodelist() {
    await this.deleteConcepts(this.concepts, true);
    await deleteConceptScheme(this.conceptScheme.id, this.store, this.toaster);
    this.isDeleteModalOpen = false;
    this.router.transitionTo('codelijsten.index');
  }

  setIsSaveButtonDisabled() {
    if (this.conceptScheme.isPublic) {
      if (this.isBackTheSavedVersion()) {
        this.isSaveDisabled = true;

        return;
      }
      if (
        this.isValidConceptSchemeName() &&
        this.isValidConceptSchemeDescription() &&
        this.isConceptListIncludingEmptyValues()
      ) {
        if (
          this.isCodelistDescriptionDeviating() ||
          this.isCodelistNameDeviating() ||
          this.isConceptListChanged() ||
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
    return this.codelistName.trim() !== '' && !this.isDuplicateName;
  }

  isValidConceptSchemeDescription() {
    return this.codelistDescription.trim() !== '';
  }

  isCodelistNameDeviating() {
    return this.conceptScheme.label.trim() !== this.codelistName;
  }

  isCodelistDescriptionDeviating() {
    return this.conceptScheme.description.trim() !== this.codelistDescription;
  }

  isBackTheSavedVersion() {
    return (
      this.conceptScheme.description == this.codelistDescription &&
      this.conceptScheme.label == this.codelistName &&
      !this.isConceptListChanged() &&
      this.conceptsToDelete.length == 0
    );
  }

  isConceptListChanged() {
    return isConceptArrayChanged(this.conceptsInDatabase, this.concepts);
  }

  mapConceptModels(concepts) {
    return concepts.map((concept) => {
      return {
        id: concept.id,
        label: concept.label,
      };
    });
  }

  async getConceptSchemeById(conceptSchemeId) {
    try {
      const conceptScheme = await this.store.findRecord(
        'concept-scheme',
        conceptSchemeId,
        {
          include: 'concepts',
        }
      );
      await conceptScheme.reload();

      return conceptScheme;
    } catch (error) {
      throw this.intl.t('constraints.couldNotGetConceptSchemeWithId', {
        id: conceptSchemeId,
      });
    }
  }
}
