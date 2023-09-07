import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import ConceptSchemeHelper from '../utils/concept-scheme-helper';

export default class InputFieldWithValidationSelector extends Component {
  @tracked field;
  @tracked allValidationConcepts = [];
  @tracked selectedValidationLabels = [];

  constructor() {
    super(...arguments);
    this.field = this.args.field;
    this.allValidationConcepts = this.args.allValidationConcepts;
    this.setSelectedvalidationOfField(this.field);
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

  setSelectedvalidationOfField(field) {
    const selectedValidationTypes = field.validationTypes.map(
      (validationtype) => {
        return this.getValidationTypeOfNamedNode(validationtype);
      }
    );
    this.selectedValidationLabels = selectedValidationTypes;
  }

  getValidationTypeOfNamedNode(namedNode) {
    return namedNode.value.split('/').pop(); // This is not something that will always work..
  }
}
