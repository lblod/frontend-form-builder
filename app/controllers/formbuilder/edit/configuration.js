import Controller from '@ember/controller';

import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { ForkingStore } from '@lblod/ember-submission-form-fields';
import { restartableTask } from 'ember-concurrency';
import { tracked } from '@glimmer/tracking';
import {
  getMinimalNodeInfo,
  getRdfTypeOfNode,
} from '../../../utils/forking-store-helpers';
import { Literal, Statement } from 'rdflib';
import { FORM, RDF } from '@lblod/submission-form-helpers';
import { sortObjectsOnProperty } from '../../../utils/sort-object-on-property';

export default class FormbuilderConfigurationController extends Controller {
  @service('form-code-manager') formCodeManager;
  @service intl;

  @tracked sections = [];
  @tracked selectedSection;
  @tracked fieldsForSection = [];

  @action
  updateTtl(ttl) {
    this.model.handleCodeChange(ttl);
  }

  @action
  updateFieldOptions(scheme) {
    const conceptSchemeConfig = {
      conceptScheme: scheme.uri,
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

    this.updateTtl(ttl);
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

      const nodeConceptSchemeUriOption = this.getConceptSchemeUriFromNodeOption(
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
        path: nodeInfo.path,
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

    this.sections = this.getSections(
      this.builderStore,
      this.model.graphs.sourceGraph
    );

    if (this.sections.length >= 1) {
      await this.setSelectedSection(this.sortedSections[0]);
    }
  });

  getSections(store, graph) {
    const config = [];

    const sectionSubjects = store
      .match(undefined, RDF('type'), FORM('Section'), graph)
      .map((triple) => triple.subject);

    for (const section of sectionSubjects) {
      const nodeInfo = getMinimalNodeInfo(section, store, graph);
      const sectionChildren = store
        .match(undefined, FORM('partOf'), section, graph)
        .map((triple) => triple.subject);

      const fieldsSubjectsToDisplay = [];
      for (const child of sectionChildren) {
        const rdfType = getRdfTypeOfNode(child, store, graph);

        if (rdfType.value != FORM('Field').value) {
          continue;
        }
        fieldsSubjectsToDisplay.push(child);
      }

      config.push({
        parent: section,
        name: nodeInfo.name,
        order: nodeInfo.order,
        childs: fieldsSubjectsToDisplay,
      });
    }

    return config;
  }

  getConceptSchemeUriFromNodeOption(node, store, graph) {
    const option = store.any(node, FORM('options'), undefined, graph);

    if (!option) {
      return option;
    }

    return JSON.parse(option.value).conceptScheme ?? null;
  }

  get sectionHasOneTableListing() {
    const tableListings = this.builderStore
      .match(
        undefined,
        RDF('type'),
        FORM('ListingTable'),
        this.model.graphs.sourceGraph
      )
      .map((triple) => triple.subject);

    if (!tableListings || tableListings.length == 0) return false;

    for (const tableListing of tableListings) {
      const isPartOf = this.builderStore.any(
        tableListing,
        FORM('partOf'),
        this.selectedSection.parent
      );

      if (!isPartOf) continue;

      return true;
    }

    return false;
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
