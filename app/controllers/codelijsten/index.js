import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';

export default class CodelijstenController extends Controller {
  @service features;
  @tracked scheme;

  sort = '-preflabel';
  page = 0;
  size = 20;
  //#region orignal codelijsten
  @action updateSelectedSchemeTo(scheme) {
    this.scheme = scheme;
  }

  get configurationCode() {
    const jsonConfigCode = {
      conceptScheme: this.scheme.uri,
      searchEnabled: true,
    };

    return JSON.stringify(jsonConfigCode, null, 2).trim();
  }
  //#endregion

  @action
  openDeleteModal(conceptSchemeModel) {
    console.log(`delete `, conceptSchemeModel);
  }
}
