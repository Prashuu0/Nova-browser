import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toggleScreenshotMode } from '../../store/slices/uiSlice';
import { getTabWebContentsId } from '../../utils/tabBrowser';

function ScreenshotTool() {
  const dispatch = useDispatch();
  const active = useSelector((state) => state.ui.screenshotMode);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!active) return null;

  const capture = async () => {
    setLoading(true);
    setError('');
    try {
      const webContentsId = await getTabWebContentsId(activeTabId);
      if (!webContentsId) {
        setError('Open a website first, then capture.');
        return;
      }
      const result = await window.novaAPI.browser.capturePage(webContentsId);
      if (result.dataUrl) setPreview(result.dataUrl);
      else setError('Could not capture this page.');
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!preview) return;
    await window.novaAPI.browser.saveScreenshot(preview);
    close();
  };

  const copy = async () => {
    if (!preview) return;
    await window.novaAPI.browser.copyScreenshot(preview);
    close();
  };

  const close = () => {
    setPreview(null);
    setError('');
    dispatch(toggleScreenshotMode());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
      <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Screenshot</h3>
          <button onClick={close} className="text-gray-400">✕</button>
        </div>
        {!preview ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-4">Capture the current page</p>
            {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
            <button onClick={capture} disabled={loading} className="px-6 py-3 bg-nova-500 text-white rounded-xl font-medium disabled:opacity-50">
              {loading ? 'Capturing...' : 'Capture Page'}
            </button>
          </div>
        ) : (
          <>
            <img src={preview} alt="Screenshot" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 mb-4 max-h-80 object-contain" />
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 py-2.5 bg-nova-500 text-white rounded-lg text-sm">Save PNG</button>
              <button onClick={copy} className="flex-1 py-2.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">Copy</button>
              <button onClick={() => setPreview(null)} className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm">Retake</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ScreenshotTool;
