import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePanel, fetchDownloads, updateProgress, downloadComplete } from '../../store/slices/downloadsSlice';

function DownloadsPanel() {
  const dispatch = useDispatch();
  const { items, panelOpen, activeCount } = useSelector((state) => state.downloads);

  useEffect(() => {
    if (panelOpen) dispatch(fetchDownloads());
  }, [panelOpen, dispatch]);

  useEffect(() => {
    const cleanup1 = window.novaAPI.downloads.onProgress((data) => {
      dispatch(updateProgress(data));
    });
    const cleanup2 = window.novaAPI.downloads.onComplete((data) => {
      dispatch(downloadComplete(data));
    });
    return () => { cleanup1?.(); cleanup2?.(); };
  }, [dispatch]);

  if (!panelOpen) return null;

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const getProgress = (item) => {
    if (!item.size) return 0;
    return Math.round((item.received_bytes / item.size) * 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={() => dispatch(togglePanel())} />
      <div className="relative w-96 bg-white dark:bg-surface-dark shadow-2xl flex flex-col animate-slide-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="font-semibold">Downloads</h2>
            {activeCount > 0 && (
              <p className="text-xs text-nova-500">{activeCount} active</p>
            )}
          </div>
          <button onClick={() => dispatch(togglePanel())} className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-1-6-6 6-6-1-1-6 6z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No downloads yet</div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-nova-500/10 flex items-center justify-center flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="text-nova-500">
                      <path d="M8 1v9.3l2.6-2.6 1.4 1.4L8 14.5 4 9.1l1.4-1.4L8 10.3V1z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.filename}</div>
                    <div className="text-xs text-gray-400">
                      {item.state === 'progressing'
                        ? `${formatSize(item.received_bytes)} / ${formatSize(item.size)}`
                        : item.state === 'completed'
                        ? formatSize(item.size)
                        : item.state}
                    </div>
                    {item.state === 'progressing' && (
                      <div className="mt-1.5 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-nova-500 rounded-full transition-all"
                          style={{ width: `${getProgress(item)}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {item.state === 'completed' && item.path && (
                    <button
                      onClick={() => window.novaAPI.downloads.open(item.path)}
                      className="text-xs text-nova-500 hover:text-nova-600 px-2 py-1 rounded hover:bg-nova-50 dark:hover:bg-nova-900/20"
                    >
                      Open
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default DownloadsPanel;
