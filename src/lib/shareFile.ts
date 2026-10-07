import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

/**
 * Writes text to a temp file and opens the native share sheet (Save to Files,
 * Mail, Drive…). The web version lives in shareFile.web.ts: Metro picks the
 * `.web.ts` file automatically when bundling for the browser.
 */
export async function shareTextFile(filename: string, contents: string, mimeType: string, uti: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error("Sharing isn't available on this device.");
  // The cache directory: the OS can clean it up later, which is right for a one-off export.
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(contents);
  await Sharing.shareAsync(file.uri, { mimeType, UTI: uti, dialogTitle: filename });
}
