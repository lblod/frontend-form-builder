import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';

export default class InputTypesListItemComponent extends Component {

  @tracked scheme;

  get hasContent() {
    return Boolean(Number(this.args.inputType.usesConceptScheme.value));
  }

  @action
  update(scheme) {
    this.args.inputType['scheme'] = {
      value: scheme
    }
  }
}
