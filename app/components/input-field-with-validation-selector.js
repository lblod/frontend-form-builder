import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ConceptSchemeHelper from '../utils/concept-scheme-helper';
import { VALIDATION_IDS } from '../utils/static-templates/validations-turtle-template';

export default class InputFieldWithValidationSelector extends Component {
  @tracked field;
  @tracked allValidationConcepts = [];
  @tracked selectedValidationLabels = [];

  constructor() {
    super(...arguments);
    this.field = this.args.field;
    this.allValidationConcepts = this.args.allValidationConcepts;
  }

  @action
  updateSelectedValidationLabels(validationlabels) {
    this.selectedValidationLabels = validationlabels;
    this.getSelectedValidationIds();
  }

  @action
  getSelectedValidationIds() {
    const validationConceptSchemeHelper = ConceptSchemeHelper.createEmpty();
    validationConceptSchemeHelper.addConcepts(this.allValidationConcepts);
    validationConceptSchemeHelper.shortenConceptListToIds(VALIDATION_IDS);

    const validationsToAdd = [];
    for (const validationLabel of this.selectedValidationLabels) {
      const uuidForPropertyValue =
        validationConceptSchemeHelper.getUuidOfConceptByPropertyValue(
          validationLabel
        );
      validationsToAdd.push(uuidForPropertyValue);
    }

    this.args.onStoreValidationIdsToAdd(this.field.uri, validationsToAdd);
  }
}
