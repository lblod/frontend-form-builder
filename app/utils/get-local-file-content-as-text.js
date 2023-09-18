export async function getLocalFileContentAsText(path) {
  const file = await fetch(path);

  return await file.text();
}
