import Component from '@glimmer/component';

export default class InputTypesListItemComponent extends Component {
  get hasContent() {
    return Boolean(Number(this.args.inputType.usesConceptScheme.value));
  }
}
