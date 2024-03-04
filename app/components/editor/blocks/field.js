import Component from '@glimmer/component';

import { SHACL, FORM } from '@lblod/submission-form-helpers';
import { DISPLAY } from '../../../utils/namespaces';

export default class EditorBlocksFieldComponent extends Component {
  get fieldName() {
    const foundName = this.data.statements.find(
      (st) => st.predicate.value == SHACL('name').value
    );
    if (!foundName) {
      console.log(`No name found for field`, this.subject);
      return null;
    }

    return foundName.object.value;
  }

  get displayTypeUri() {
    const foundType = this.data.statements.find(
      (st) => st.predicate.value == FORM('displayType').value
    );
    if (!foundType) {
      console.log(`No displaytype found for field`, this.subject);
      return null;
    }

    return foundType.object.value;
  }

  get data() {
    return this.args.data;
  }

  get isDefaultInput() {
    return this.displayTypeUri == DISPLAY('defaultInput').value;
  }
}
