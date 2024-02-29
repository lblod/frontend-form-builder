import Controller from '@ember/controller';
import { sortObjectsOnProperty } from '../../utils/sort-object-on-property';

export default class FormbuilderEditorController extends Controller {
  constructor() {
    super(...arguments);
    console.log(`Editor | controller`);
  }

  get sortedBasicElements() {
    return sortObjectsOnProperty(this.basicElements, 'order');
  }

  get basicElements() {
    return [
      {
        label: 'Sectie',
        order: 1,
      },
      {
        label: 'Veld',
        order: 2,
      },
      {
        label: 'Listing',
        order: 3,
      },
      {
        label: 'Tabel',
        order: 4,
      },
    ];
  }
}
