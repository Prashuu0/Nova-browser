import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab } from '../../store/slices/tabsSlice';
import { getTabWebContentsId } from '../../utils/tabBrowser';

function PDFToolbar({ tabId }) {
  const dispatch = useDispatch();
  const tab = useSelector((state) => state.tabs.tabs.find((t) => t.id === tabId));
  const zoom = tab?.zoom || 100;

  const setZoom = async (delta) => {
    const newZoom = Math.min(200, Math.max(50, zoom + delta));
    dispatch(updateTab({ id: tabId, zoom: newZoom }));
    const webContentsId = await getTabWebContentsId(tabId);
    if (webContentsId) {
      await window.novaAPI.browser.setZoom(webContentsId, newZoom / 100);
    }
  };

  const print = async () => {
    const webContentsId = await getTabWebContentsId(tabId);
    if (webContentsId) window.novaAPI.browser.print(webContentsId);
  };

  const download = () => {
    if (tab?.url) window.novaAPI.shell.openExternal(tab.url);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-white text-xs border-b border-gray-700">
      <span className="font-medium">📄 PDF Viewer</span>
      <div className="flex-1" />
      <button onClick={() => setZoom(-10)} className="px-2 py-1 rounded hover:bg-gray-700">−</button>
      <span>{zoom}%</span>
      <button onClick={() => setZoom(10)} className="px-2 py-1 rounded hover:bg-gray-700">+</button>
      <button onClick={print} className="px-3 py-1 rounded hover:bg-gray-700 ml-2">Print</button>
      <button onClick={download} className="px-3 py-1 rounded hover:bg-gray-700">Download</button>
    </div>
  );
}

export function isPdfUrl(url) {
  if (!url) return false;
  return /\.pdf(\?|#|$)/i.test(url) || url.includes('application/pdf');
}

export default PDFToolbar;
