export default `
@prefix : <#>.
@prefix form: <http://lblod.data.gift/vocabularies/forms/>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix displayTypes: <http://lblod.data.gift/display-types/>.
@prefix nodes: <http://data.lblod.info/form-data/nodes/>.
@prefix emb: <http://ember-submission-form-fields/>.
@prefix ext: <http://mu.semte.ch/vocabularies/ext/> .

##########################################################
# form
##########################################################
  emb:source-node a form:Form, form:TopLevelForm ;
    form:includes nodes:24289e48-258f-4919-8c3e-5783a6acb4a4;
    sh:group ext:lijst .

##########################################################
#  Lijst
##########################################################
ext:lijst a form:PropertyGroup ;
  sh:name "Lijst" ;
  sh:order 1 .

##########################################################
#  Item
##########################################################
nodes:24289e48-258f-4919-8c3e-5783a6acb4a4 a form:Field ;
  form:displayType displayTypes:defaultInput ;
  sh:group ext:lijst ;
  sh:name "Item" ;
  sh:order 2 ;
  sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .
`;
