export function showErrorToasterMessage(
  toasterService,
  message,
  timeInMs = 5000
) {
  toasterService.error(message, 'Error', {
    timeOut: timeInMs,
  });
}
