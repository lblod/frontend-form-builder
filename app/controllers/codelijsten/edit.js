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
import { downloadTextAsFile } from '../../utils/download-text-as-file';

export default class CodelijstenEditController extends Controller {
  @service toaster;
  @service store;
  @service router;
  @service intl;

  @tracked isArchiveModalOpen;
  @tracked isDuplicateName;
  @tracked isSaveDisabled;
  @tracked isSaveModalOpen;
  @tracked nextRoute;

  dbConceptScheme;
  @tracked schemeName;
  @tracked schemeNameErrorMessage;
  @tracked schemeDescription;
  @tracked schemeDescriptionErrorMessage;

  dbConcepts;
  @tracked conceptList;
  @tracked conceptsToDelete;

  setup = restartableTask(async (conceptSchemeId) => {
    this.resetStateOfErrors();

    this.dbConceptScheme = await this.getConceptSchemeById(conceptSchemeId);
    this.schemeName = this.dbConceptScheme.label;
    this.schemeDescription = this.dbConceptScheme.description;

    this.conceptsToDelete = [];
    this.conceptList = A([]);
    this.dbConcepts = await this.dbConceptScheme.getConceptModels();
    this.conceptList.pushObjects(
      this.dbConcepts.map((concept) => this.conceptModelToListItem(concept))
    );

    this.setSaveButtonState();
  });

  @action
  updateSchemeName(event) {
    this.schemeName = event.target.value.trim() ?? '';
    this.schemeNameErrorMessage = null;
    this.validateSchemeName.perform().then(() => this.setSaveButtonState());
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

  @action
  updateSchemeDescription(event) {
    this.schemeDescription = event.target.value.trim() ?? '';
    this.schemeDescriptionErrorMessage = null;
    this.validateSchemeDescription
      .perform()
      .then(() => this.setSaveButtonState());
  }

  validateSchemeDescription = restartableTask(async () => {
    if (!this.schemeDescription || this.schemeDescription.trim() == '') {
      this.schemeDescriptionErrorMessage = this.intl.t(
        'constraints.mandatoryField'
      );
      return;
    }

    if (this.schemeDescription.length > DESCRIPTION_INPUT_CHAR_LIMIT) {
      this.schemeDescriptionErrorMessage = this.intl.t(
        'constraints.maxCharactersReachedWithCount',
        {
          count: this.schemeDescription.length,
          maxCount: DESCRIPTION_INPUT_CHAR_LIMIT,
        }
      );
      return;
    }

    this.schemeDescriptionErrorMessage = null;
  });

  @action
  updateConceptLabel(concept, event) {
    const label = event.target.value.trim() ?? '';
    const foundConcept = this.conceptList.find((c) => c.id == concept.id);
    const indexOfConcept = this.conceptList.indexOf(foundConcept);
    this.conceptList[indexOfConcept].label = label;

    if (label == '') {
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('constraints.optionCannotBeEmpty', { label: concept.label })
      );
    }

    this.setSaveButtonState();
  }

  saveUnsavedChanges = restartableTask(async () => {
    if (this.hasErrors()) {
      this.isSaveModalOpen = false;
      showErrorToasterMessage(
        this.toaster,
        this.intl.t('messages.error.codelistHasErrors')
      );
      return;
    }

    await this.save();
    this.isSaveModalOpen = false;
    this.goToNextRoute();
  });

  @action
  async addNewConcept() {
    const concept = this.store.createRecord('concept', {
      preflabel: '',
      conceptSchemes: [this.dbConceptScheme],
    });
    await concept.save();
    await concept.reload();
    this.conceptList.pushObject({
      id: concept.id,
      label: concept.label,
    });

    this.setSaveButtonState();
  }

  @action
  async save() {
    if (
      this.isCodelistNameDeviating() ||
      this.isCodelistDescriptionDeviating()
    ) {
      this.dbConceptScheme.preflabel = this.schemeName;
      this.dbConceptScheme.description = this.schemeDescription;

      try {
        await this.dbConceptScheme.save();
        this.dbConceptScheme.reload();

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

    if (this.isConceptListChanged()) {
      await this.updateConcepts();
    }

    // soft reset of the variables as everything is saved
    this.resetStateOfErrors();
    this.dbConcepts = [...this.conceptList];
    this.conceptsToDelete = [];

    this.setSaveButtonState();
  }

  async updateConcepts() {
    for (const concept of this.conceptList) {
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
    const conceptToDelete = this.conceptList.find(
      (con) => con.id == concept.id
    );

    if (conceptToDelete) {
      this.conceptList.removeObject(conceptToDelete);

      if (!this.dbConcepts.find((con) => con.id == concept.id)) {
        await deleteConcept(concept.id, this.store, this.toaster, true);
      } else {
        this.conceptsToDelete.push(conceptToDelete);
      }
    }

    this.setSaveButtonState();
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
      this.conceptList.removeObject(conceptToDelete);
    }
  }

  async deleteCodelist() {
    await this.deleteConcepts(this.conceptList, true);
    await deleteConceptScheme(
      this.dbConceptScheme.id,
      this.store,
      this.toaster
    );
    this.router.transitionTo('codelijsten.index');
  }

  archiveCodelist = restartableTask(async () => {
    this.dbConceptScheme.isarchived = true;

    try {
      await this.dbConceptScheme.save();
      this.dbConceptScheme.reload();
      showSuccessToasterMessage(
        this.toaster,
        this.schemeName,
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

  @action
  async exportCodelist() {
    const conceptScheme = await this.getConceptSchemeById(
      this.dbConceptScheme.id
    );
    const codelistTtlCode = await conceptScheme.modelWithConceptsAsTtlCode();

    downloadTextAsFile(
      {
        filename: this.getExportFileName(),
        contentAsText: codelistTtlCode,
      },
      document,
      window
    );
  }

  @action
  async discardSave() {
    this.schemeName = this.dbConceptScheme.label;
    this.schemeDescription = this.dbConceptScheme.description;
    this.conceptList = this.dbConcepts;
    this.conceptsToDelete = [];
    this.schemeNameErrorMessage = null;
    this.schemeDescriptionErrorMessage = null;

    this.isSaveModalOpen = false;
    this.setSaveButtonState();

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

  resetStateOfErrors() {
    this.schemeNameErrorMessage = null;
    this.schemeDescriptionErrorMessage = null;
    this.isDuplicateName = false;
  }

  setSaveButtonState() {
    if (this.isReadOnly || this.isBackTheSavedVersion()) {
      this.isSaveDisabled = true;
      return;
    }

    if (this.hasErrors()) {
      this.isSaveDisabled = true;
      return;
    }

    if (
      this.isValidConceptSchemeName() &&
      this.schemeDescription.trim() !== ''
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
      const hasNoEmptyConceptLabels = this.hasNoEmptyConceptLabels();

      if (hasNoEmptyConceptLabels) {
        this.isSaveDisabled = false;
      } else {
        this.isSaveDisabled = true;
      }
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

  getExportFileName() {
    const isoDate = new Date().toISOString();
    const date = isoDate.slice(0, 10);

    return `codelijst-${this.dbConceptScheme.id}-${date}.ttl`;
  }

  async getConceptSchemeById(conceptSchemeId) {
    try {
      const conceptScheme = await this.store.findRecord(
        'concept-scheme',
        conceptSchemeId
      );

      return conceptScheme;
    } catch (error) {
      throw this.intl.t('constraints.couldNotGetConceptSchemeWithId', {
        id: conceptSchemeId,
      });
    }
  }

  conceptModelToListItem(model) {
    return {
      id: model.id,
      label: model.label,
    };
  }

  hasErrors() {
    const flags = [
      this.schemeNameErrorMessage,
      this.schemeDescriptionErrorMessage,
      this.isDuplicateName,
      !this.hasNoEmptyConceptLabels(),
    ];

    return flags.some((flag) => flag);
  }

  hasNoEmptyConceptLabels() {
    return this.conceptList.every((concept) => concept.label.trim() !== '');
  }

  isValidConceptSchemeName() {
    return this.schemeName.trim() !== '' && !this.isDuplicateName;
  }

  isCodelistNameDeviating() {
    return this.dbConceptScheme.label.trim() !== this.schemeName;
  }

  isCodelistDescriptionDeviating() {
    return this.dbConceptScheme.description.trim() !== this.schemeDescription;
  }

  isBackTheSavedVersion() {
    return (
      this.dbConceptScheme.description == this.schemeDescription &&
      this.dbConceptScheme.label == this.schemeName &&
      !this.isConceptListChanged() &&
      this.conceptsToDelete.length == 0
    );
  }

  isConceptListChanged() {
    return isConceptArrayChanged(this.dbConcepts, this.conceptList);
  }

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
      this.hasConceptsInList &&
      this.isValidConceptSchemeName() &&
      !this.isArchivedConceptScheme &&
      this.isSaveDisabled
    );
  }

  get canExportCodelist() {
    return (
      !this.isPrivateConceptScheme &&
      this.hasConceptsInList &&
      this.isValidConceptSchemeName() &&
      this.isSaveDisabled
    );
  }

  get splitButtonHasActiveActions() {
    return this.canArchiveCodelist || this.canExportCodelist;
  }

  get hasConceptsInList() {
    return this.conceptList ? this.conceptList.length >= 1 : false;
  }

  get pageHasErrors() {
    return this.hasErrors();
  }
}
