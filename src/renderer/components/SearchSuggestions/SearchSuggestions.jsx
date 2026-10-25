import React from 'react';

function SearchSuggestions({ suggestions, onSelect }) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-surface-dark rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-fade-in">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          onMouseDown={() => onSelect(suggestion)}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" className="text-gray-400 flex-shrink-0">
            <path d="M6 0a6 6 0 100 12A6 6 0 006 0zm4.5 10.5l3 3-1 1-3-3 1-1z" />
          </svg>
          <span className="truncate">{suggestion}</span>
        </button>
      ))}
    </div>
  );
}

export default SearchSuggestions;
