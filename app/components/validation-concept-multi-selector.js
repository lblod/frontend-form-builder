import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ConceptSchemeHelper from '../utils/concept-scheme-helper';
import { VALIDATION_IDS } from '../utils/static-templates/validations-turtle-template';

export default class ValidationConceptMultiSelector extends Component {
  @tracked validationOptions;
  @tracked selectedValidationLabels;

  validationConceptSchemeHelper = ConceptSchemeHelper.createEmpty();
  NAME_PROPERTY = 'prefLabel';

  constructor() {
    super(...arguments);
    this.validationOptions = [];
    this.validationConceptSchemeHelper.addConcepts(
      this.args.allValidationConcepts
    );

    this.selectedValidationLabels = this.args.selectedValidationLabels;
    this.setValidationOptions();
  }

  async setValidationOptions() {
    this.validationConceptSchemeHelper.shortenConceptListToIds(VALIDATION_IDS); // Possible to let this be populated by the InputFieldWithValidationSelector component
    this.validationOptions =
      this.validationConceptSchemeHelper.getMappedConceptPropertyValues(
        this.NAME_PROPERTY
      );
  }

  @action
  updatedSelectedValidationLabels() {
    this.args.onValidationSelectionUpdated(this.selectedValidationLabels);
  }
}
