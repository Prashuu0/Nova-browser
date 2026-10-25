import React from 'react';
import { NovaLogo } from './NovaLogo';

function NovaSearchBar({ value, onChange, onSearch, onClear, placeholder, autoFocus, size = 'lg' }) {
  const isLarge = size === 'lg';

  const handleKey = (e) => {
    if (e.key === 'Enter') onSearch?.(value);
  };

  return (
    <div
      className={`flex items-center gap-3 bg-[#2b2d31]/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all focus-within:border-nova-500/40 focus-within:shadow-nova-500/10 ${
        isLarge ? 'rounded-2xl px-5 py-4' : 'rounded-full px-4 py-2.5'
      }`}
    >
      <NovaLogo size={isLarge ? 'sm' : 'sm'} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder={placeholder || 'Ask anything, find anything...'}
        autoFocus={autoFocus}
        className={`flex-1 bg-transparent outline-none text-white placeholder-white/40 ${
          isLarge ? 'text-lg' : 'text-sm'
        }`}
      />
      {value && (
        <button
          onClick={onClear}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
          </svg>
        </button>
      )}
      <button
        onClick={() => onSearch?.(value)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white/60 hover:text-nova-400 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M7.5 1a6.5 6.5 0 104.6 11.2l3 3 1.4-1.4-3-3A6.5 6.5 0 007.5 1zm0 2a4.5 4.5 0 110 9 4.5 4.5 0 010-9z" />
        </svg>
      </button>
    </div>
  );
}

export default NovaSearchBar;
