import Component from '@glimmer/component';

import { EXT } from '../../utils/namespaces';
import { RDF, FORM, SHACL } from '@lblod/submission-form-helpers';
import { Statement } from 'rdflib';
import { getTtlWithAddedStatements } from '../../utils/forking-store/get-ttl-with-statements-added';
import { service } from '@ember/service';

export default class CalculationOutcomeFieldComponent extends Component {
  @service('form-code-manager') formCodeManager;

  constructor() {
    super(...arguments);

    // Now the additions to the ttl are only applied when
    // switching from a tab, we should find a solution for this
    if (!this.isScopeCreated()) {
      this.addScopeToTtl();
    }
  }

  addScopeToTtl() {
    const ttlCodeWithAddedScope = getTtlWithAddedStatements(
      this.formCodeManager.getTtlOfLatestVersion(),
      this.createScopeStatements()
    );

    this.formCodeManager.addFormCode(ttlCodeWithAddedScope);
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

  isScopeCreated() {
    return (
      this.store.match(
        EXT(this.scopeName),
        undefined,
        undefined,
        this.graphs.formGraph
      ).length >= 1
    );
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
