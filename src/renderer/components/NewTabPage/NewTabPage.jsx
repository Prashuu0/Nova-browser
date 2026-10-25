import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateTab } from '../../store/slices/tabsSlice';
import { setShieldStats } from '../../store/slices/uiSlice';
import NovaSearchBar from '../common/NovaSearchBar';

function NewTabPage({ tabId }) {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const shieldStats = useSelector((state) => state.ui.shieldStats);

  useEffect(() => {
    const loadStats = () => {
      window.novaAPI?.privacy?.getPrivacyStats?.()
        .then((data) => dispatch(setShieldStats(data || {})))
        .catch(() => {});
    };

    loadStats();
    const interval = setInterval(loadStats, 3000);
    const cleanup = window.novaAPI?.privacy?.onStatsUpdated?.((data) => {
      dispatch(setShieldStats(data || {}));
    });

    return () => {
      clearInterval(interval);
      cleanup?.();
    };
  }, [dispatch]);

  const navigate = async (input) => {
    if (!input.trim()) return;
    const resolved = await window.novaAPI.navigation.resolveUrl(input);
    if (resolved.url) {
      dispatch(updateTab({
        id: tabId,
        url: resolved.url,
        pageType: resolved.pageType || 'newtab',
        isLoading: resolved.pageType === 'web',
        isNewTab: resolved.type === 'newtab',
        title: resolved.type === 'search' ? `${resolved.query} - Nova Search` : input,
        hasError: false
      }));
    }
  };

  const blocked = shieldStats?.totalBlocked || 0;
  const saved = shieldStats?.bandwidthSaved || '0 B';

  return (
    <div className="flex-1 relative overflow-hidden min-h-0">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15,15,26,0.3) 0%, rgba(15,15,26,0.85) 70%, rgba(15,15,26,1) 100%),
            url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a] via-transparent to-[#0f0f1a]/40" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-32">
          <div className="w-full max-w-2xl">
            <NovaSearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={navigate}
              onClear={() => setSearchQuery('')}
              placeholder="Ask anything, find anything..."
              autoFocus
              size="lg"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[280px] max-w-md bg-[#2b2d31]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Trackers & ads blocked</span>
                <span className="text-orange-400 font-semibold text-lg">
                  {blocked.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Bandwidth saved</span>
                <span className="text-nova-400 font-semibold text-lg">{saved}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Search engine</span>
                <span className="text-white font-semibold">Nova Search</span>
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-[280px] max-w-md bg-[#2b2d31]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-nova-600 flex items-center justify-center text-xl flex-shrink-0">
              ✨
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Nova AI Assistant</p>
              <p className="text-white/50 text-xs mt-0.5">Summarize pages, research & chat</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewTabPage;
