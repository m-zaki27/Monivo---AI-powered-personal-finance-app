/** Browser version: there's no share sheet for local files, so download it instead. */
export async function shareTextFile(filename: string, contents: string, mimeType: string, _uti: string): Promise<void> {
  // The BOM (﻿) makes Excel read the file as UTF-8, so "Joe’s Pizza" keeps its apostrophe.
  const blob = new Blob(['﻿', contents], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
