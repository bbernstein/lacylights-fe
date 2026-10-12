/**
 * Read a File/Blob as text. Uses Blob.text() when available and falls back
 * to FileReader for older environments.
 */
export function readFileAsText(file: Blob): Promise<string> {
  if (typeof file.text === 'function') {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
