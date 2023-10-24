import { templatePrefixes } from './template-prefixes';

export const fieldValidationFormTemplate = `
${templatePrefixes}

  ##########################################################
  # Form
  ##########################################################
  ext:form a form:Form, form:TopLevelForm ;
    form:includes ext:formNodesL .

  ##########################################################
  #  Property-groups
  ##########################################################
  ext:formFieldPg a form:PropertyGroup;
    sh:name "" ;
    sh:order 1 .
`;
