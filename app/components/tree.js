import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { FIELDS, FIELD_GROUPS, RDF } from '../utils/rdflib';
import { NamedNode, Statement, namedNode, triple, serialize, graph } from 'rdflib';
import { action } from "@ember/object";

export default class TreeComponent extends Component {
  get form() {
    return this.args.form
  }

  get graphs() {
    return this.args.graphs
  }

  get propertyGroups() {
    const results = this.args.formStore.match(
      null,
      RDF('type'),
      namedNode("http://lblod.data.gift/vocabularies/forms/PropertyGroup"),
      this.graphs.formGraph
    )

    return results
  }

  get tree() {
    let structure = this.propertyGroups;

    /** Make a group structure. We want the property groups to be top level. 
     * @returns array<objects>
     */
    structure = structure.map(item => {
      const groupProperties = this.args.formStore.match(
        item.subject,
        null,
        null,
        this.graphs.formGraph
      )

      const name = groupProperties.filter((item) => 
        item.predicate.value == "http://www.w3.org/ns/shacl#name"
      )

      const description = groupProperties.filter((item) => 
        item.predicate.value == "http://www.w3.org/ns/shacl#description"
      )

      const help = groupProperties.filter((item) => 
        item.predicate.value == "http://lblod.data.gift/vocabularies/forms/help"
      )

      if(!name.length) return;

      return { 
        uri: item.subject.value,
        name: name[0].object.value,
        description: description[0]?.object.value,
        help: help[0]?.object.value
      }
    });

    /** Filter array items that are undefined (happens when property group does not have name property*/
    structure = structure.filter((item) => item !== undefined)

    /** Add an array of fields inside each property group. Property group holds title and helptext while fields are the input fields, checkboxes etc */
    structure = structure.map((item) => {
      const fields = this.args.formStore.match(
        null,
        namedNode("http://www.w3.org/ns/shacl#group"),
        namedNode(item.uri),
        this.graphs.formGraph
      )

      /** extract displayType, name & validations from each field */
      item.fields = fields.map((item) => {
        const fieldProperties = this.args.formStore.match(
          item.subject,
          null,
          null,
          this.graphs.formGraph
        )

          
        const fieldUri = fieldProperties.filter((item) => 
          item.predicate.value == "http://lblod.data.gift/vocabularies/forms/displayType"
        )
  
        const fieldTypeProperty = fieldProperties.filter((item) => 
          item.predicate.value == "http://lblod.data.gift/vocabularies/forms/displayType"
        )
  
        const nameProperty = fieldProperties.filter((item) => 
          item.predicate.value == "http://www.w3.org/ns/shacl#name"
        )
  
        const validationProperty = fieldProperties.filter((item) => 
          item.predicate.value == "http://lblod.data.gift/vocabularies/forms/validations"
        )
          
        /** Each field has an array of validations simply holding the URI of the validation e.g. http://lblod.data.gift/vocabularies/forms/RequiredConstraint */
        const validationList = validationProperty.map((item) => {
          const validationObject = this.args.formStore.match(
            item.object,
            null,
            null,
            this.graphs.formGraph
          )
  
          const validationType = validationObject.filter((item) =>
            item.predicate.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
          )
          
          return validationType[0].object.value
        })
  
        return {
          uri: item.subject.value,
          name: nameProperty[0]?.object.value,
          fieldType: fieldTypeProperty.length ? fieldTypeProperty[0].object.value : "",
          validations: validationList
        };
      })
      return item
    })
    return structure
  }

  constructor() {
    super(...arguments);
  }

  @action
  showCode(uri) {
    const triples = this.args.formStore.match(
      namedNode(uri),
      null,
      null,
      this.graphs.formGraph
    )


    const code = triples.map((item) => 
      item.toNT()
    )

    alert(code.join("\n"))
    console.log(code.join("\n"))
  }

  @action updateName(field, e) {
    const newValue = e.target.value

    // Remove old old
    this.args.formStore.removeMatches(
      namedNode(field.uri),
      namedNode("http://www.w3.org/ns/shacl#name"),
      null,
      this.graphs.formGraph
    )

    // insert new triple
    const triples = [
      {
        subject: namedNode(field.uri),
        predicate: namedNode("http://www.w3.org/ns/shacl#name"),
        object: newValue,
        graph: this.graphs.formGraph,
      }
    ]

    this.args.formStore.addAll(triples)


    const sourceTtl =  this.args.formStore.serializeDataMergedGraph(this.graphs.sourceGraph);

    this.args.refresh.perform()
  }

}
