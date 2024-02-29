import Component from '@glimmer/component';

export default class EditorBuildingViewComponent extends Component {
  get formCode() {
    return this.args.formTtl;
  }
}
