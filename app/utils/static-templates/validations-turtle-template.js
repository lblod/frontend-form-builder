export default `
##########################################################
#  Validations
##########################################################

nodes:629bddbb-bf30-48d6-95af-c2f406bd9e8c
  a form:RequiredConstraint;
  form:grouping form:Bag;
  sh:resultMessage "Dit veld is verplicht".

nodes:60873518-5423-4121-ba6a-9635b18242a0
  a form:MaxLength;
  form:grouping form:MatchEvery;
  form:max "100";
  sh:resultMessage "Max. karakters overschreden.".
`