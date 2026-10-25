import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUpdateAvailable } from '../../store/slices/uiSlice';

function UpdateBanner() {
  const dispatch = useDispatch();
  const updateInfo = useSelector((state) => state.ui.updateAvailable);

  useEffect(() => {
    const cleanup = window.novaAPI?.update?.onAvailable?.((info) => {
      dispatch(setUpdateAvailable(info));
    });
    return () => cleanup?.();
  }, [dispatch]);

  if (!updateInfo) return null;

  return (
    <div className="bg-nova-500 text-white px-4 py-2 flex items-center justify-between text-sm">
      <span>Nova Browser {updateInfo.version} is available</span>
      <div className="flex gap-2">
        <button onClick={() => window.novaAPI.update.download()} className="px-3 py-1 bg-white/20 rounded-lg">Download</button>
        <button onClick={() => window.novaAPI.update.install()} className="px-3 py-1 bg-white text-nova-600 rounded-lg font-medium">Install</button>
      </div>
    </div>
  );
}

export default UpdateBanner;
