import Controller from '@ember/controller';
import template from '../util/basic-form-template';
import { v4 as uuidv4 } from 'uuid';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class FormsPlaygroundController extends Controller {
  @tracked template;

  constructor() {
    super(...arguments);
    this.template = template;
  }

  @action
  insertFieldInForm(field) {
    const displayType = field.displayType.value;
    const uuid = uuidv4();

    const ttl = `
@prefix form: <http://lblod.data.gift/vocabularies/forms/> .
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix mu: <http://mu.semte.ch/vocabularies/core/> .
@prefix fieldGroups: <http://data.lblod.info/field-groups/> .
@prefix fields: <http://data.lblod.info/fields/> .
@prefix displayTypes: <http://lblod.data.gift/display-types/> .
@prefix skos: <http://www.w3.org/2004/02/skos/core#> .
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .

##########################################################
#  property-group
##########################################################
fields:8e24d707-0e29-45b5-9bbf-a39e4fdb2c11 a form:PropertyGroup;
    mu:uuid "8e24d707-0e29-45b5-9bbf-a39e4fdb2c11";
    sh:description "parent property-group, used to group fields and property-groups together";
    sh:name "This is a simple example form configuration ttl, make sure you correctly mapped your own form configuration" ;
    sh:order 1 .

##########################################################
# field
##########################################################
fields:${uuid} a form:Field ;
    mu:uuid "${uuid}";
    sh:name "Name" ;
    sh:order 10 ;
    sh:path ext:path ;
    form:displayType displayTypes:${displayType} ;
    sh:group fields:8e24d707-0e29-45b5-9bbf-a39e4fdb2c11 .

##########################################################
# form
##########################################################
fieldGroups:main a form:FieldGroup ;
    mu:uuid "70eebdf0-14dc-47f7-85df-e1cfd41c3855" ;
    form:hasField
      fields:${uuid} .

form:6b70a6f0-cce2-4afe-81f5-5911f45b0b27 a form:Form ;
    mu:uuid "6b70a6f0-cce2-4afe-81f5-5911f45b0b27" ;
    form:hasFieldGroup fieldGroups:main .
    `;
    this.template = ttl;
  }
}


