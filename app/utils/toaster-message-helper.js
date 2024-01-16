export function showErrorToasterMessage(
  toasterService,
  message,
  title = 'Error',
  timeInMs = 5000
) {
  toasterService.error(message, title, {
    timeOut: timeInMs,
  });
}

export function showWarningToasterMessage(
  toasterService,
  message,
  title = 'Opgelet',
  timeInMs = 5000
) {
  toasterService.warning(message, title, {
    timeOut: timeInMs,
  });
}
