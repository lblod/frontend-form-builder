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

export function showSuccessToasterMessage(
  toasterService,
  message,
  title = 'Success',
  timeInMs = 5000
) {
  toasterService.success(message, title, {
    timeOut: timeInMs,
  });
}
