import React, { useState, useEffect } from 'react';

function TitleBar() {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.novaAPI.window.isMaximized().then(setIsMaximized);
  }, []);

  const handleMaximize = async () => {
    const maximized = await window.novaAPI.window.maximize();
    setIsMaximized(maximized);
  };

  const openIncognito = () => {
    window.novaAPI.window.newIncognito();
  };

  return (
    <div className="drag-region flex items-center justify-between h-8 bg-nova-900 dark:bg-surface-darker px-2 select-none">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-nova-400 to-nova-600 flex items-center justify-center">
          <span className="text-[8px] font-bold text-white">N</span>
        </div>
        <span className="text-xs font-semibold text-white/90">Nova Browser</span>
        <button
          onClick={openIncognito}
          title="New Incognito Window (Ctrl+Shift+N)"
          className="ml-2 px-2 py-0.5 text-[10px] rounded bg-white/10 hover:bg-white/20 text-white/70"
        >
          Incognito
        </button>
      </div>
      <div className="flex items-center no-drag">
        <button
          onClick={() => window.novaAPI.window.minimize()}
          className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          title="Minimize"
        >
          <svg width="10" height="1" viewBox="0 0 10 1"><rect fill="currentColor" className="text-white/80" width="10" height="1" /></svg>
        </button>
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
          title={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/80">
              <path fill="currentColor" d="M2 0h6v2H2V0zm0 2v6h6V2H2zm2 2h2v2H4V4z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/80">
              <rect fill="none" stroke="currentColor" strokeWidth="1" x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          onClick={() => window.novaAPI.window.close()}
          className="w-10 h-8 flex items-center justify-center hover:bg-red-500 transition-colors group"
          title="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" className="text-white/80 group-hover:text-white">
            <path fill="currentColor" d="M1 0L0 1l4 4-4 4 1 1 4-4 4 4 1-1-4-4 4-4-1-1-4 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default TitleBar;
