export async function getLocalFileContentAsText(localPath) {
  const file = await fetch(localPath);

  return await file.text();
}
