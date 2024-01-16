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
