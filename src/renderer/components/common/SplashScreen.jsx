import React, { useEffect, useState } from 'react';

function SplashScreen({ onDone }) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFade(true), 1400);
    const t2 = setTimeout(() => onDone?.(), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a0a14] transition-opacity duration-500 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-600 via-nova-500 to-fuchsia-500 flex items-center justify-center shadow-2xl shadow-nova-500/40 animate-pulse">
          <span className="text-4xl font-black text-white">N</span>
        </div>
        <div className="absolute -inset-4 rounded-full border border-nova-500/20 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <h1 className="text-2xl font-bold text-white tracking-tight">Nova Browser</h1>
      <p className="text-sm text-nova-400 mt-2">Privacy · AI · Cloud</p>
      <div className="mt-10 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-violet-500 to-nova-400 rounded-full loading-shimmer" style={{ width: '70%' }} />
      </div>
    </div>
  );
}

export default SplashScreen;
