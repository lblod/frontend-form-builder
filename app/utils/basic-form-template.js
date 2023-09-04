export default `@prefix : <#>.
@prefix form: <http://lblod.data.gift/vocabularies/forms/>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix displayTypes: <http://lblod.data.gift/display-types/>.
@prefix nodes: <http://data.lblod.info/form-data/nodes/>.
@prefix emb: <http://ember-submission-form-fields/>.

##########################################################
# form
##########################################################
  emb:source-node a form:Form, form:TopLevelForm ;
    form:includes nodes:24289e48-258f-4919-8c3e-5783a6acb4a4;
    sh:group nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1 .

##########################################################
#  property-group
##########################################################
nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1
  a form:PropertyGroup; 
  sh:name "Title"; 
  sh:order 1.


##########################################################
#  Input field
##########################################################
nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
  a form:Field;
  form:displayType displayTypes:defaultInput;
  sh:group nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1;
  sh:name "Text field";
  sh:order 2;
  sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .

##########################################################
#  Validations
##########################################################
nodes:629bddbb-bf30-48d6-95af-c2f406bd9e8c
  a form:RequiredConstraint;
  form:grouping form:Bag;
  sh:resultMessage "Dit veld is verplicht";
  sh:name "RequiredConstraint".
`;
