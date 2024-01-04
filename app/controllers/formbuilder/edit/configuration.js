import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask } from 'ember-concurrency';
import { getPropertyGroupFields } from '../../../utils/get-property-group-items';
import { tracked } from '@glimmer/tracking';
import {
  getDisplayTypeOfNode,
  getNameOfNode,
  getOrderOfNode,
} from '../../../utils/forking-store-helpers';
import { Literal, Statement } from 'rdflib';
import { FORM } from '../../../utils/rdflib';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked sections = [];
  @tracked selectedSection;
  @tracked fieldsForSection = [];

  initialise = restartableTask(async () => {
    this.builderStore = new ForkingStore();
    this.builderStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    this.sections = getPropertyGroupFields(
      this.builderStore,
      this.model.graphs.sourceGraph
    );
  });

  get sortedSections() {
    return this.sections.sort((a, b) => {
      let fa = a.order,
        fb = b.order;

      if (fa < fb) {
        return -1;
      }
      if (fa > fb) {
        return 1;
      }
      return 0;
    });
  }

  get sortedFieldsForSection() {
    return this.fieldsForSection.sort((a, b) => {
      let fa = a.order,
        fb = b.order;

      if (fa < fb) {
        return -1;
      }
      if (fa > fb) {
        return 1;
      }
      return 0;
    });
  }

  @action
  updateFieldOptions(scheme) {
    const conceptSchemeConfig = {
      conceptScheme: scheme.uri,
      searchEnabled: true,
    };
    const existingOptionsOnField = this.builderStore.match(
      scheme.field.subject,
      FORM('options'),
      undefined,
      this.model.graphs.sourceGraph
    );

    this.builderStore.removeStatements(existingOptionsOnField);
    this.builderStore.addAll([
      new Statement(
        scheme.field.subject,
        FORM('options'),
        new Literal(JSON.stringify(conceptSchemeConfig, null, 2).trim()),
        this.model.graphs.sourceGraph
      ),
    ]);

    const ttl = this.builderStore.serializeDataMergedGraph(
      this.model.graphs.sourceGraph
    );

    this.model.handleCodeChange(ttl);
  }

  @action
  setSelectedSection(selectedOption) {
    this.selectedSection = selectedOption;
    if (!this.selectedSection) {
      return;
    }
    this.fieldsForSection = [];

    for (const child of this.selectedSection.childs) {
      const displayType = getDisplayTypeOfNode(
        child,
        this.builderStore,
        this.model.graphs.sourceGraph
      );
      const name = getNameOfNode(
        child,
        this.builderStore,
        this.model.graphs.sourceGraph
      );
      const order = getOrderOfNode(
        child,
        this.builderStore,
        this.model.graphs.sourceGraph
      );

      this.fieldsForSection.push({
        name: name,
        order: order,
        subject: child,
        displayType: displayType,
      });
    }
  }

  setup() {
    this.initialise.perform();
  }
}
