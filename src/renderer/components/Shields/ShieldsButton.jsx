import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateSetting } from '../../store/slices/settingsSlice';
import { setShieldStats, setShieldsMenuOpen } from '../../store/slices/uiSlice';

function ShieldsButton() {
  const dispatch = useDispatch();
  const settings = useSelector((state) => state.settings.data);
  const stats = useSelector((state) => state.ui.shieldStats);
  const activeTab = useSelector((state) => state.tabs.tabs.find((t) => t.id === state.tabs.activeTabId));
  const [open, setOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    if (!open) return undefined;

    window.novaAPI.privacy.getPrivacyStats().then((data) => {
      dispatch(setShieldStats(data || {}));
    });

    const cleanup = window.novaAPI.privacy.onStatsUpdated?.((data) => {
      dispatch(setShieldStats(data || {}));
    });

    if (activeTab?.url?.startsWith('http')) {
      try {
        const origin = new URL(activeTab.url).origin;
        window.novaAPI.siteSettings.get(origin).then(setSiteSettings);
      } catch {}
    } else {
      setSiteSettings(null);
    }

    return () => cleanup?.();
  }, [open, activeTab?.url, dispatch]);

  const toggleAdBlocker = async (v) => {
    dispatch(updateSetting({ key: 'adBlockerEnabled', value: v }));
    await window.novaAPI.privacy.setAdBlocker(v);
  };

  const toggleTrackerBlocker = async (v) => {
    dispatch(updateSetting({ key: 'trackerBlockerEnabled', value: v }));
    await window.novaAPI.privacy.setTrackerBlocker(v);
  };

  const toggleSiteSetting = async (key, value) => {
    if (!activeTab?.url?.startsWith('http')) return;
    const origin = new URL(activeTab.url).origin;
    const updated = { ...siteSettings, [key]: value };
    setSiteSettings(updated);
    await window.novaAPI.siteSettings.set({ origin, settings: updated });
  };

  const blocked = stats?.totalBlocked || 0;
  const shieldsUp = settings.adBlockerEnabled && settings.trackerBlockerEnabled;
  const siteOrigin = activeTab?.url?.startsWith('http') ? new URL(activeTab.url).hostname : null;

  return (
    <div className="relative">
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          dispatch(setShieldsMenuOpen(next));
        }}
        title="Nova Shields"
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          shieldsUp ? 'text-nova-500 bg-nova-500/10' : 'text-orange-500 bg-orange-500/10'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1L2 4v4c0 3.3 2.6 6.4 6 7 3.4-.6 6-3.7 6-7V4L8 1z" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => { setOpen(false); dispatch(setShieldsMenuOpen(false)); }} />
          <div className="absolute right-0 top-10 z-50 w-72 bg-[#2b2d31] border border-white/10 rounded-xl shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Nova Shields</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full ${shieldsUp ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {shieldsUp ? 'Up' : 'Down'}
              </span>
            </div>
            <p className="text-white/50 text-xs mb-4">{blocked} trackers & ads blocked</p>
            <ShieldToggle label="Block Ads (Global)" checked={settings.adBlockerEnabled} onChange={toggleAdBlocker} />
            <ShieldToggle label="Block Trackers (Global)" checked={settings.trackerBlockerEnabled} onChange={toggleTrackerBlocker} />
            <ShieldToggle label="HTTPS-Only Mode" checked={settings.httpsOnlyMode} onChange={(v) => dispatch(updateSetting({ key: 'httpsOnlyMode', value: v }))} />
            <ShieldToggle label="Fingerprint v2" checked={settings.fingerprintProtection} onChange={(v) => { dispatch(updateSetting({ key: 'fingerprintProtection', value: v })); window.novaAPI.privacy.setFingerprintProtection(v); }} />
            {siteOrigin && siteSettings && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs text-nova-400 mb-2">Per-site: {siteOrigin}</p>
                <ShieldToggle label="Ads on this site" checked={siteSettings.adsEnabled} onChange={(v) => toggleSiteSetting('adsEnabled', v)} />
                <ShieldToggle label="Trackers on this site" checked={siteSettings.trackersEnabled} onChange={(v) => toggleSiteSetting('trackersEnabled', v)} />
                <ShieldToggle label="HTTPS only this site" checked={siteSettings.httpsOnly} onChange={(v) => toggleSiteSetting('httpsOnly', v)} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ShieldToggle({ label, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/80">{label}</span>
      <button
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-nova-500' : 'bg-gray-600'} ${disabled ? 'opacity-50' : ''}`}
      >
        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

export default ShieldsButton;
