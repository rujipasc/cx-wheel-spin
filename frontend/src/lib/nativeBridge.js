function getAppBridge() {
  return window?.go?.main?.App;
}

export function hasNativeBridge() {
  return Boolean(getAppBridge());
}

export async function pickImportFileNative() {
  const bridge = getAppBridge();
  if (!bridge?.PickImportFile) return null;
  return bridge.PickImportFile();
}

export async function pickImportPreviewNative() {
  const bridge = getAppBridge();
  if (!bridge?.PickImportPreview) return null;
  return bridge.PickImportPreview();
}

export async function saveFileBase64Native(defaultName, base64Data) {
  const bridge = getAppBridge();
  if (!bridge?.SaveFileBase64) return null;
  return bridge.SaveFileBase64(defaultName, base64Data);
}

export async function saveResultsXlsxNative(
  defaultName,
  rows
) {
  const bridge = getAppBridge();
  if (!bridge?.SaveResultsXLSX) return null;
  return bridge.SaveResultsXLSX(defaultName, rows);
}
