export default `@prefix : <#>.
@prefix form: <http://lblod.data.gift/vocabularies/forms/>.
@prefix sh: <http://www.w3.org/ns/shacl#>.
@prefix displayTypes: <http://lblod.data.gift/display-types/>.
@prefix nodes: <http://data.lblod.info/form-data/nodes/>.
@prefix emb: <http://ember-submission-form-fields/>.

nodes:24289e48-258f-4919-8c3e-5783a6acb4a4
    a form:Field;
    form:displayType displayTypes:defaultInput;
    form:validatedBy
            [
                a form:RequiredConstraint;
                form:grouping form:Bag;
                sh:order 1;
                sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
                sh:resultMessage "Required one"
            ],
            [
                a form:RequiredConstraint;
                form:grouping form:Bag;
                sh:order 2;
                sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40;
                sh:resultMessage "Required two"
            ];
    sh:group nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1;
    sh:name "Field name";
    sh:order 2;
    sh:path nodes:e61f56db-6346-4a61-a75e-33e091789e40 .
nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1
a form:Section; sh:name "Title"; sh:order 1 .
emb:source-node
    a form:Form, form:TopLevelForm;
    form:includes nodes:24289e48-258f-4919-8c3e-5783a6acb4a4;
    sh:group nodes:d7b33768-3723-4291-a7be-3d8a7d7cdbc1 .
`;
