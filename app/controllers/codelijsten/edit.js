import Controller from '@ember/controller';

import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { A } from '@ember/array';
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
import { updateConcept } from '../../utils/codelijsten/update-concept';
import { isConceptArrayChanged } from '../../utils/codelijsten/compare-concept-arrays';
import { restartableTask } from 'ember-concurrency';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';
import { downloadTextAsFile } from '../../utils/download-text-as-file';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;
  @service intl;

  @tracked codelistName;
  @tracked codelistDescription;
  @tracked conceptsToDelete;

  @tracked descriptionErrorMessage;

  @tracked isArchiveModalOpen;
  @tracked isDuplicateName;
  @tracked isSaveDisabled;
  @tracked isSaveModalOpen;
  @tracked nextRoute;

  dbConceptScheme;

  @tracked schemeName;
  @tracked schemeNameErrorMessage;

  @tracked schemeDescription;

  dbConcepts;
  @tracked conceptList = A([]);

  get isReadOnly() {
    if (!this.dbConceptScheme) return true;

    return this.isPrivateConceptScheme || this.isArchivedConceptScheme;
  }

  get isPrivateConceptScheme() {
    if (!this.dbConceptScheme) return true;

    return !this.dbConceptScheme.isPublic;
  }

  get isArchivedConceptScheme() {
    if (!this.dbConceptScheme) return false;

    return this.dbConceptScheme.isArchived;
  }

  get canArchiveCodelist() {
    return (
      !this.isPrivateConceptScheme &&
      this.hasConcepts &&
      this.isValidConceptSchemeName() &&
      !this.isArchivedConceptScheme &&
      this.isSaveDisabled
    );
  }

  get canExportCodelist() {
    return (
      !this.isPrivateConceptScheme &&
      this.hasConcepts &&
      this.isValidConceptSchemeName() &&
      this.isSaveDisabled
    );
  }

  get splitButtonHasActiveActions() {
    return this.canArchiveCodelist || this.canExportCodelist;
  }

  get hasConcepts() {
    return this.concepts ? this.concepts.length >= 1 : false;
  }

  setup = restartableTask(async (conceptSchemeId) => {
    console.log(`| SETUP |`);
    this.resetErrors();

    this.dbConceptScheme = await this.getConceptSchemeById(conceptSchemeId);
    this.schemeName = this.dbConceptScheme.label;
    this.schemeDescription = this.dbConceptScheme.description;

    this.dbConcepts = await this.dbConceptScheme.getConceptModels();
    this.conceptList.pushObjects(
      this.dbConcepts.map((concept) => this.conceptModelToListItem(concept))
    );

    console.log(`dbConceptScheme: `, this.dbConceptScheme);
    console.log(`    schemeName: `, this.schemeName);
    console.log(`    schemeDescription: `, this.schemeDescription);
    console.log(`dbConcepts: `, this.dbConcepts);
    console.log(`    conceptList: `, this.conceptList);
  });

  conceptModelToListItem(model) {
    return {
      id: model.id,
      label: model.label,
    };
  }

  @action
  updateSchemeName(event) {
    this.schemeName = event.target.value.trim() ?? '';
    this.schemeNameErrorMessage = null;
    this.validateSchemeName.perform();
    console.log(`scheme name validation: `);
    console.log(`    schemeNameErrorMessage: `, this.schemeNameErrorMessage);
  }

  validateSchemeName = restartableTask(async () => {
    if (!this.schemeName || this.schemeName.trim() == '') {
      this.schemeNameErrorMessage = this.intl.t('constraints.mandatoryField');
      return;
    }

    if (this.schemeName.length > NAME_INPUT_CHAR_LIMIT) {
      this.schemeNameErrorMessage = this.intl.t(
        'constraints.maconstraints.maxCharactersReached'
      );
      return;
    }

    if (
      (await this.isDuplicateConceptSchemeName()) &&
      this.schemeName !== this.dbConceptScheme.label
    ) {
      this.schemeNameErrorMessage = this.intl.t('constraints.duplicateName');
      return;
    }

    this.schemeNameErrorMessage = null;
  });

  async isDuplicateConceptSchemeName() {
    const duplicates = await this.store.query('concept-scheme', {
      filter: {
        ':exact:preflabel': this.schemeName.trim(),
      },
    });

    if (duplicates.length == 1 && duplicates[0].id == self.id) {
      return false;
    }

    return duplicates.length !== 0;
  }

  saveUnsavedChanges = restartableTask(async () => {
    await this.save();
    this.isSaveModalOpen = false;
    this.goToNextRoute();
  });

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
        'constraints.maxCharactersReachedWithCount',
        {
          count: this.codelistDescription.length,
          maxCount: DESCRIPTION_INPUT_CHAR_LIMIT,
        }
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
        await this.conceptScheme.save();
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

  async deleteCodelist() {
    await this.deleteConcepts(this.concepts, true);
    await deleteConceptScheme(this.conceptScheme.id, this.store, this.toaster);
    this.router.transitionTo('codelijsten.index');
  }

  archiveCodelist = restartableTask(async () => {
    this.conceptScheme.isarchived = true;

    try {
      await this.conceptScheme.save();
      this.conceptScheme.reload();
      showSuccessToasterMessage(
        this.toaster,
        this.codelistName,
        this.intl.t('messages.subjects.archived')
      );
    } catch (error) {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.somethingWentWrong'),
        this.intl.t('crud.archive')
      );
    }

    this.isArchiveModalOpen = false;
    this.router.transitionTo('codelijsten.index');
  });

  setIsSaveButtonDisabled() {
    if (this.isReadOnly || this.isBackTheSavedVersion()) {
      this.isSaveDisabled = true;
      return;
    }

    if (
      this.isValidConceptSchemeName() &&
      this.isValidConceptSchemeDescription()
    ) {
      if (
        this.isCodelistDescriptionDeviating() ||
        this.isCodelistNameDeviating()
      ) {
        this.isSaveDisabled = false;
      } else {
        this.isSaveDisabled = true;
      }
    }

    if (this.isConceptListChanged() || this.conceptsToDelete.length >= 1) {
      if (this.hasNoEmptyValuesInConceptList()) {
        this.isSaveDisabled = false;
      } else {
        this.isSaveDisabled = true;
      }
    }
  }

  @action
  async exportCodelist() {
    const latestConceptScheme = await this.getConceptSchemeById(
      this.conceptScheme.id
    );
    const codelistTtlCode =
      await latestConceptScheme.modelWithConceptsAsTtlCode();

    downloadTextAsFile(
      {
        filename: this.getExportFileName(),
        contentAsText: codelistTtlCode,
      },
      document,
      window
    );
  }

  getExportFileName() {
    return `codelijst-${this.conceptScheme.id}-${this.getIsoDate()}.ttl`;
  }

  getIsoDate() {
    const isoDate = new Date().toISOString();

    return isoDate.slice(0, 10);
  }

  hasNoEmptyValuesInConceptList() {
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
    console.log(`| GET CONCEPTSCHEME BY ID |`);
    try {
      const conceptScheme = await this.store.findRecord(
        'concept-scheme',
        conceptSchemeId
      );
      console.log(`conceptscheme`, conceptScheme);
      console.log(`| GET CONCEPTSCHEME BY ID  END |`);
      return conceptScheme;
    } catch (error) {
      throw this.intl.t('constraints.couldNotGetConceptSchemeWithId', {
        id: conceptSchemeId,
      });
    }
  }

  @action
  opposite(boolean) {
    if (typeof boolean !== 'boolean') {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.valueMustBeBoolean', {
          value: boolean,
        })
      );
      return false;
    }

    return !boolean;
  }

  @action
  async discardSave() {
    this.codelistName = this.conceptScheme.label;
    this.codelistDescription = this.conceptScheme.description;
    this.concepts = await this.conceptScheme.getConceptModels();
    this.conceptsToDelete = [];
    this.schemeNameErrorMessage = null;
    this.descriptionErrorMessage = null;

    this.isSaveModalOpen = false;
    this.setIsSaveButtonDisabled();

    this.goToNextRoute();
  }

  @action
  goToNextRoute() {
    this.router.transitionTo(this.nextRoute);
  }

  showSaveModal(nextRoute) {
    this.isSaveModalOpen = true;
    this.nextRoute = nextRoute;
  }

  resetErrors() {
    this.schemeNameErrorMessage = null;
    this.descriptionErrorMessage = null;
    this.isDuplicateName = false;
  }
}
