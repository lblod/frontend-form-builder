import Component from '@glimmer/component';
import { EXT } from '../../utils/namespaces';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';

export default class CalculationOutcomeFieldComponent extends Component {
  constructor() {
    super(...arguments);
    console.log('arguments', this.args);
    this.addScopeToTtl();
  }

  addScopeToTtl() {
    this.store.addAll(this.createScopeStatements());
    console.log(`ttlCode after adding the scope`, this.ttlCode);
  }

  createScopeStatements() {
    const subject = EXT(this.scopeName);
    const type = new Statement(
      subject,
      RDF('type'),
      FORM('scope'),
      this.graphs.sourceGraph
    );
    const path = new Statement(
      subject,
      SHACL('path'),
      this.scopePath,
      this.graphs.sourceGraph
    );

    return [type, path];
  }

  get ttlCode() {
    return this.store.serializeDataMergedGraph(this.graphs.sourceGraph);
  }

  get scopePath() {
    return EXT('outcome');
  }

  get scopeName() {
    return `${this.fieldId}-outcomeS`;
  }

  get fieldId() {
    const url = this.field.uri.value;
    const parts = url.split('/');
    const id = parts[parts.length - 1];

    return id;
  }

  get store() {
    return this.args.formStore;
  }

  get graphs() {
    return this.args.graphs;
  }

  get field() {
    return this.args.field;
  }
}
