import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePrivacyDashboard } from '../../store/slices/uiSlice';

function PrivacyDashboard() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.ui.privacyDashboard);
  const [stats, setStats] = useState({
    totalBlocked: 0,
    trackersBlocked: 0,
    adsBlocked: 0,
    bandwidthSaved: '0 B',
    trackers: []
  });
  const [cookieCount, setCookieCount] = useState(0);
  const settings = useSelector((state) => state.settings.data);

  useEffect(() => {
    if (!open) return undefined;

    const load = () => {
      window.novaAPI.privacy.getPrivacyStats().then(setStats);
      window.novaAPI.privacy.getCookieCount().then(setCookieCount);
    };

    load();
    const interval = setInterval(load, 3000);
    const cleanup = window.novaAPI.privacy.onStatsUpdated?.((data) => {
      setStats(data || {});
    });

    return () => {
      clearInterval(interval);
      cleanup?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(togglePrivacyDashboard())} />
      <div className="relative w-[550px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-green-500">
                <path d="M10 1L3 4v5c0 4.1 3.1 7.9 7 9 3.9-1.1 7-4.9 7-9V4l-7-3z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-lg">Privacy Dashboard</h2>
              <p className="text-xs text-gray-400">Your browsing protection status</p>
            </div>
          </div>
          <button onClick={() => dispatch(togglePrivacyDashboard())} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Trackers Blocked" value={stats.trackersBlocked || 0} color="text-green-500" />
          <StatCard label="Ads Blocked" value={stats.adsBlocked || 0} color="text-orange-500" />
          <StatCard label="Bandwidth Saved" value={stats.bandwidthSaved || '0 B'} color="text-nova-500" isText />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <StatCard label="Total Blocked" value={stats.totalBlocked || 0} color="text-green-500" />
          <StatCard label="Cookies Stored" value={cookieCount} color="text-yellow-500" />
        </div>

        <div className="space-y-3 mb-6">
          <ProtectionRow label="Ad Blocker" enabled={settings.adBlockerEnabled} />
          <ProtectionRow label="Tracker Blocker" enabled={settings.trackerBlockerEnabled} />
          <ProtectionRow label="Fingerprint Protection" enabled={settings.fingerprintProtection} />
          <ProtectionRow label="Do Not Track" enabled={settings.doNotTrack} />
          <ProtectionRow label="Third-Party Cookie Block" enabled={settings.blockThirdPartyCookies} />
        </div>

        {stats.trackers.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Top Blocked Trackers</h3>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {stats.trackers.slice(0, 10).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="truncate">{t.domain}</span>
                  <span className="text-gray-400 flex-shrink-0 ml-2">{t.blocked_count}x</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, isText }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{isText ? value : value.toLocaleString()}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ProtectionRow({ label, enabled }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${enabled ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
        {enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

export default PrivacyDashboard;
