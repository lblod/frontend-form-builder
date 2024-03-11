import { SHACL } from '@lblod/submission-form-helpers';

export function formatShaclValidationReport(report) {
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
  const subject = validationResult.focusNode.id;
  const predicate = validationResult.path.id;
  const errorType = getErrorTypeOutOfSeverity(validationResult.severity);
  const messages = validationResult.message;

  return {
    subject: subject,
    errorOn: predicate,
    severity: errorType,
    messages: messages.map((literal) => literal.value),
  };
}

function getErrorTypeOutOfSeverity(severity) {
  const uri = severity.value;
  return uri.replace(SHACL().value, '');
}
