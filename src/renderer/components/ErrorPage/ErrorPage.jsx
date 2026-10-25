import React from 'react';

function ErrorPage({ errorCode, errorDescription, url, onRetry }) {
  const messages = {
    '-105': 'Unable to resolve the server\'s DNS address.',
    '-106': 'No internet connection.',
    '-118': 'Connection timed out.',
    '-200': 'Certificate error.',
    '-300': 'Redirect loop detected.',
    '-501': 'Insecure content blocked.'
  };

  const message = messages[String(errorCode)] || errorDescription || 'This page could not be loaded.';

  return (
    <div className="flex flex-col items-center justify-center h-full bg-white dark:bg-surface-dark px-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-gray-400">
            <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
            <path d="M20 12v10M20 26v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-2">Page Not Available</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-2">{message}</p>
        {url && (
          <p className="text-xs text-gray-400 mb-6 break-all">{url}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onRetry}
            className="px-6 py-2.5 bg-nova-500 text-white rounded-lg hover:bg-nova-600 transition-colors font-medium"
          >
            Try Again
          </button>
          <button
            onClick={() => window.novaAPI.navigation.resolveUrl('nova://newtab').then((r) => onRetry(r.url))}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Go Home
          </button>
        </div>
        {errorCode && (
          <p className="text-xs text-gray-400 mt-4">Error code: {errorCode}</p>
        )}
      </div>
    </div>
  );
}

export default ErrorPage;
