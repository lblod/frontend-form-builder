import Component from '@glimmer/component';

export default class TableListingConfigurationComponent extends Component {
  constructor() {
    super(...arguments);

    console.log(this.args);
  }
}
