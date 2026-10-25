export async function getTabWebContentsId(tabId) {
  if (!tabId || !window.novaAPI?.tabBrowser?.getWebContentsId) return null;
  const data = await window.novaAPI.tabBrowser.getWebContentsId(tabId);
  return data?.webContentsId ?? null;
}

export async function runInActiveTab(tabId, script) {
  if (!tabId || !window.novaAPI?.tabBrowser?.executeJavaScript) return null;
  const data = await window.novaAPI.tabBrowser.executeJavaScript(tabId, script);
  return data?.result ?? null;
}
