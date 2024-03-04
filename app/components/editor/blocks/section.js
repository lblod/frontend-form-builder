import Component from '@glimmer/component';

import { SHACL } from '@lblod/submission-form-helpers';

export default class EditorBlocksSectionComponent extends Component {
  get sectionName() {
    const foundName = this.data.statements.find(
      (st) => st.predicate.value == SHACL('name').value
    );
    if (!foundName) {
      console.log(`No name found for section`, this.subject);
      return null;
    }

    return foundName.object.value;
  }

  get data() {
    return this.args.data;
  }
}
