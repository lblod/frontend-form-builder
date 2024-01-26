import { SHACL } from '@lblod/submission-form-helpers';

export function formatChaclValidationReport(report) {
  const errorDetails = [];
  for (const validationResult of report.results) {
    errorDetails.push(formatValidationResult(validationResult));
  }

  return {
    isConform: report.conforms,
    errorCount: report.results.length,
    errorDetails: errorDetails,
  };
}

function formatValidationResult(validationResult) {
  console.log(validationResult);
  const subject = validationResult.focusNode.id;
  const predicate = validationResult.path.id;
  const errorType = getErrorTypeOutOfSeverity(validationResult.severity);
  const messages = validationResult.message;

  return {
    subject: subject,
    errorOn: predicate,
    errorType: errorType,
    messages: messages.map((literal) => literal.value),
  };
}

function getErrorTypeOutOfSeverity(severity) {
  const uri = severity.value;
  return uri.replace(SHACL().value, '');
}
