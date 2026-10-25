import React from 'react';
import { useDispatch } from 'react-redux';
import { savePassword } from '../../store/slices/passwordsSlice';
import { clearPendingPassword } from '../../store/slices/uiSlice';

function PasswordSavePrompt({ pending }) {
  const dispatch = useDispatch();

  if (!pending) return null;

  const handleSave = () => {
    dispatch(savePassword({
      origin: pending.origin,
      username: pending.username,
      password: pending.password
    }));
    dispatch(clearPendingPassword());
  };

  const handleDismiss = () => {
    dispatch(clearPendingPassword());
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-80 bg-[#2b2d31] border border-white/10 rounded-2xl shadow-2xl p-4 animate-slide-in">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-nova-500/20 flex items-center justify-center flex-shrink-0">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" className="text-nova-400">
            <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm">Save password?</h3>
          <p className="text-white/50 text-xs mt-1 truncate">{pending.origin}</p>
          <p className="text-white/70 text-sm mt-2">{pending.username}</p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleSave}
              className="flex-1 py-2 bg-nova-500 hover:bg-nova-600 text-white text-sm rounded-lg font-medium"
            >
              Save
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-white/80 text-sm rounded-lg"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PasswordSavePrompt;
