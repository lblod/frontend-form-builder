import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import {
  getConceptSchemeUriFromNodeOption,
  getMinimalNodeInfo,
  getRdfTypeOfNode,
} from '../../../utils/forking-store-helpers';
import { Literal, Statement } from 'rdflib';
import { FORM, RDF, SH } from '../../../utils/rdflib';
import { sortObjectsOnProperty } from '../../../utils/sort-object-on-property';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;

  @tracked sections = [];
  @tracked selectedSection;
  @tracked fieldsForSection = [];

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
  async setSelectedSection(selectedOption) {
    this.selectedSection = selectedOption;
    if (!this.selectedSection) {
      return;
    }

    const storedFieldsForSection = [];
    for (const child of this.selectedSection.childs) {
      const nodeInfo = getMinimalNodeInfo(
        child,
        this.builderStore,
        this.model.graphs.sourceGraph
      );

      const nodeConceptSchemeUriOption =
        await getConceptSchemeUriFromNodeOption(
          child,
          this.builderStore,
          this.model.graphs.sourceGraph
        );

      storedFieldsForSection.push({
        name: nodeInfo.name,
        order: nodeInfo.order,
        subject: child,
        conceptSchemeUriOption: nodeConceptSchemeUriOption,
        displayType: nodeInfo.displayType,
      });
    }

    this.fieldsForSection = storedFieldsForSection;
  }

  initialise = restartableTask(async () => {
    this.builderStore = new ForkingStore();
    this.builderStore.parse(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.model.graphs.sourceGraph.value,
      'text/turtle'
    );

    this.sections = this.getPropertyGroupFields(
      this.builderStore,
      this.model.graphs.sourceGraph
    );

    if (this.sections.length >= 1) {
      await this.setSelectedSection(this.sortedSections[0]);
    }
  });

  getPropertyGroupFields(store, graph) {
    const config = [];

    const propertyGroupSubjects = store
      .match(undefined, RDF('type'), FORM('PropertyGroup'), graph)
      .map((triple) => triple.subject);

    for (const propertyGroupSubject of propertyGroupSubjects) {
      const nodeInfo = getMinimalNodeInfo(propertyGroupSubject, store, graph);
      const subjectsOfGroup = store
        .match(undefined, SH('group'), propertyGroupSubject, graph)
        .map((triple) => triple.subject);

      const fieldsSubjectsToDisplay = [];
      for (const subjectInGroup of subjectsOfGroup) {
        const rdfType = getRdfTypeOfNode(subjectInGroup, store, graph);

        if (rdfType.value != FORM('Field').value) {
          console.warn(`Only fields are supported to be displayed per section`);
          continue;
        }
        fieldsSubjectsToDisplay.push(subjectInGroup);
      }

      config.push({
        parent: propertyGroupSubject,
        name: nodeInfo.name,
        order: nodeInfo.order,
        childs: fieldsSubjectsToDisplay,
      });
    }

    return config;
  }

  setup() {
    this.fieldsForSection = null;
    this.setSelectedSection(null);

    this.initialise.perform();
  }

  get sortedSections() {
    return sortObjectsOnProperty(this.sections, 'order');
  }

  get sortedFieldsForSection() {
    return sortObjectsOnProperty(this.fieldsForSection, 'order');
  }
}
