export function downloadTextAsFile(
  { filename, contentAsText },
  document,
  window
) {
  // Create a link
  let downloadLink = document.createElement('a');
  downloadLink.download = filename;

  // generate Blob where file content will exists
  let blob = new Blob([contentAsText], { type: 'text/plain' });
  downloadLink.href = window.URL.createObjectURL(blob);

  // Click file to download then destroy link
  downloadLink.click();
  downloadLink.remove();
}
