import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setNovaHubOpen } from '../../store/slices/uiSlice';

function NovaHubPanel() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.ui.novaHubOpen);
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabId = useSelector((state) => state.tabs.activeTabId);
  const [tab, setTab] = useState('account');
  const [analytics, setAnalytics] = useState(null);
  const [account, setAccount] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncPass, setSyncPass] = useState('');
  const [extensions, setExtensions] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [msg, setMsg] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [vpnStatus, setVpnStatus] = useState(null);
  const [vpnServers, setVpnServers] = useState([]);
  const [chromeExtId, setChromeExtId] = useState('');
  const [inbox, setInbox] = useState({ alias: '', messages: [] });
  const [driveFiles, setDriveFiles] = useState([]);
  const [mailTo, setMailTo] = useState('');
  const [mailSubject, setMailSubject] = useState('');
  const [mailBody, setMailBody] = useState('');

  const refresh = async () => {
    const acc = await window.novaAPI.account.get();
    setAccount(acc);
    setExtensions(await window.novaAPI.extensions.getAll());
    if (acc?.cloud) {
      const status = await window.novaAPI.sync.cloudStatus().catch(() => null);
      setSyncStatus(status);
    }
  };

  useEffect(() => {
    if (!open) return;
    refresh().then(() => {
      window.novaAPI.vpn?.getStatus?.().then(setVpnStatus).catch(() => {});
    });
    window.novaAPI.extensions.getCatalog().then((r) => setCatalog(r?.extensions || [])).catch(() => {});
    window.novaAPI.analytics?.getDashboard?.().then(setAnalytics).catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || !account?.cloud) return;
    window.novaAPI.vpn?.getServers?.().then((r) => setVpnServers(r?.servers || [])).catch(() => {});
  }, [open, account?.cloud]);

  if (!open) return null;

  const hubTabs = [
    { id: 'account', label: 'Account' },
    { id: 'sync', label: 'Cloud Sync' },
    { id: 'store', label: 'Nova Store' },
    { id: 'extensions', label: 'Extensions' },
    { id: 'feedback', label: 'Feedback' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'email', label: 'Nova Email' },
    { id: 'drive', label: 'Nova Drive' },
    { id: 'vpn', label: 'VPN' },
    { id: 'services', label: 'Platform' },
    { id: 'update', label: 'Updates' }
  ];

  const handleSignUp = async () => {
    const r = await window.novaAPI.account.signUp({ email, password });
    setMsg(r.error || r.message || 'Account created!');
    if (r.success) { setAccount(r.account); refresh(); }
  };

  const handleSignIn = async () => {
    const r = await window.novaAPI.account.signIn({ email, password });
    setMsg(r.error || (r.cloud ? 'Signed in to Nova Cloud!' : 'Signed in locally'));
    if (r.success) { setAccount(r.account); refresh(); }
  };

  const handleSignOut = async () => {
    await window.novaAPI.account.signOut();
    setAccount(null);
    setMsg('Signed out');
  };

  const handleCloudSync = async () => {
    setMsg('Syncing to Nova Cloud...');
    const push = await window.novaAPI.sync.cloudPush({ tabs, activeTabId });
    if (push.error) { setMsg(push.error); return; }
    const pull = await window.novaAPI.sync.cloudPull();
    setMsg(pull.success ? `Synced! ${pull.items || 0} items` : pull.error || 'Sync failed');
    refresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => dispatch(setNovaHubOpen(false))} />
      <div className="relative w-[780px] h-[560px] bg-[#1a1a2e] rounded-2xl shadow-2xl flex overflow-hidden border border-nova-500/20">
        <div className="w-48 bg-[#12121f] border-r border-white/5 p-3">
          <div className="flex items-center gap-2 px-2 py-3 mb-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-nova-500 flex items-center justify-center text-white font-bold text-sm">N</div>
            <span className="font-bold text-white text-sm">Nova Hub</span>
          </div>
          {hubTabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`w-full text-left px-3 py-2 rounded-xl text-sm mb-0.5 transition-colors ${tab === t.id ? 'bg-nova-500/20 text-nova-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 p-6 overflow-y-auto text-gray-200">
          <button onClick={() => dispatch(setNovaHubOpen(false))} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

          {tab === 'account' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-xl font-semibold text-white">Nova Account</h3>
              <p className="text-sm text-gray-400">Sign in to sync bookmarks, passwords, history across devices.</p>
              {account ? (
                <div className="p-4 bg-nova-500/10 rounded-2xl border border-nova-500/20">
                  <p className="font-medium text-white">{account.displayName}</p>
                  <p className="text-sm text-gray-400">{account.email}</p>
                  <div className="flex gap-2 mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${account.cloud ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {account.cloud ? '☁️ Nova Cloud' : '💾 Local only'}
                    </span>
                    {account.emailVerified === false && <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400">Verify email</span>}
                  </div>
                  <button onClick={handleSignOut} className="mt-4 text-sm text-red-400 hover:text-red-300">Sign out</button>
                </div>
              ) : (
                <>
                  <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-nova-500/50 outline-none" />
                  <input type="password" placeholder="Password (min 8 chars)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm focus:border-nova-500/50 outline-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSignUp} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-nova-500 text-white rounded-xl text-sm font-medium">Create Account</button>
                    <button onClick={handleSignIn} className="flex-1 py-2.5 bg-white/10 rounded-xl text-sm hover:bg-white/15">Sign In</button>
                  </div>
                  <button onClick={async () => { const r = await window.novaAPI.account.forgotPassword(email); setMsg(r.message || 'Check your email'); }} className="text-xs text-nova-400 hover:underline">Forgot password?</button>
                </>
              )}
            </div>
          )}

          {tab === 'sync' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-xl font-semibold text-white">Nova Cloud Sync</h3>
              <p className="text-sm text-gray-400">Desktop ↔ Cloud ↔ Mobile — bookmarks, passwords, history, settings, tabs, AI chats.</p>
              {syncStatus && (
                <div className="p-3 bg-white/5 rounded-xl text-xs text-gray-400">
                  Last sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                  {syncStatus.devices?.length > 0 && <p className="mt-1">Devices: {syncStatus.devices.map((d) => d.device_name).join(', ')}</p>}
                </div>
              )}
              <button onClick={handleCloudSync} disabled={!account?.cloud} className="w-full py-3 bg-gradient-to-r from-violet-600 to-nova-500 text-white rounded-xl text-sm font-medium disabled:opacity-40">
                ☁️ Sync Now
              </button>
              <button onClick={async () => { const r = await window.novaAPI.searchIndex.sync(); setMsg(r.success ? `Search index updated (${r.ingested} pages)` : r.error || 'Index sync failed'); }} disabled={!account?.cloud} className="w-full py-2.5 bg-white/10 rounded-xl text-sm disabled:opacity-40">
                🔍 Sync Nova Search Index
              </button>
              <div className="border-t border-white/10 pt-4">
                <p className="text-xs text-gray-500 mb-2">Offline backup (.novasync file)</p>
                <input type="password" placeholder="Encryption passphrase" value={syncPass} onChange={(e) => setSyncPass(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm mb-2" />
                <div className="flex gap-2">
                  <button onClick={async () => { const r = await window.novaAPI.sync.export({ passphrase: syncPass }); setMsg(r.path ? `Exported` : 'Cancelled'); }} className="flex-1 py-2 bg-white/10 rounded-xl text-xs">Export File</button>
                  <button onClick={async () => { const r = await window.novaAPI.sync.import({ passphrase: syncPass }); setMsg(r.success ? `Imported ${r.items} items` : r.canceled ? 'Cancelled' : 'Failed'); }} className="flex-1 py-2 bg-white/10 rounded-xl text-xs">Import File</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'store' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Nova Store</h3>
              <p className="text-sm text-gray-400">Official Nova extensions — privacy, productivity, AI tools.</p>
              <div className="grid grid-cols-2 gap-3">
                {catalog.map((ext) => (
                  <div key={ext.id} className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:border-nova-500/30 transition-colors">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-white text-sm">{ext.name}</p>
                      {ext.is_featured && <span className="text-[10px] bg-nova-500/20 text-nova-400 px-1.5 py-0.5 rounded">★</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{ext.description}</p>
                    <p className="text-[10px] text-gray-600 mt-2">v{ext.version} · {ext.install_count || 0} installs</p>
                    <button
                      onClick={async () => {
                        const r = await window.novaAPI.extensions.installFromStore({ extensionId: ext.id });
                        setMsg(r.success ? `Installed ${ext.name}` : r.error || 'Install failed');
                        if (r.success) refresh();
                      }}
                      className="mt-3 w-full py-1.5 bg-nova-500/20 text-nova-400 rounded-lg text-xs hover:bg-nova-500/30"
                    >
                      Install
                    </button>
                  </div>
                ))}
                {!catalog.length && <p className="text-sm text-gray-500 col-span-2">Start Nova Cloud to browse extensions. Run: cd nova-cloud && npm run dev</p>}
              </div>
            </div>
          )}

          {tab === 'extensions' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Extension Manager</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => window.novaAPI.extensions.openFolder()} className="px-3 py-2 bg-nova-500/20 text-nova-400 rounded-xl text-xs">Open Folder</button>
                <button onClick={async () => { const r = await window.novaAPI.extensions.installUnpacked(); setMsg(r.success ? 'Extension installed' : r.error || 'Cancelled'); refresh(); }} className="px-3 py-2 bg-white/10 rounded-xl text-xs">Install Unpacked</button>
                <button onClick={async () => { const r = await window.novaAPI.extensions.installZip(); setMsg(r.success ? 'ZIP installed' : r.error || 'Cancelled'); refresh(); }} className="px-3 py-2 bg-white/10 rounded-xl text-xs">Install .zip</button>
                <button onClick={async () => { const r = await window.novaAPI.extensions.installCrx(); setMsg(r.success ? 'CRX installed' : r.error || 'Cancelled'); refresh(); }} className="px-3 py-2 bg-white/10 rounded-xl text-xs">Install .crx</button>
              </div>
              <div className="flex gap-2">
                <input value={chromeExtId} onChange={(e) => setChromeExtId(e.target.value)} placeholder="Chrome Web Store extension ID" className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm" />
                <button onClick={async () => { const r = await window.novaAPI.extensions.installChromeId(chromeExtId); setMsg(r.success ? `Installed ${r.name}` : r.error || 'Failed'); refresh(); }} className="px-4 py-2 bg-nova-500 text-white rounded-xl text-xs">Install</button>
              </div>
              {extensions.map((ext) => (
                <div key={ext.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                  <span className="text-sm">{ext.name} v{ext.version}</span>
                  <button onClick={async () => { await window.novaAPI.extensions.toggle({ id: ext.id, enabled: !ext.enabled }); refresh(); }} className={`text-xs px-3 py-1 rounded-lg ${ext.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-600/30 text-gray-400'}`}>
                    {ext.enabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'analytics' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Nova Analytics</h3>
              {analytics ? (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Total Users', value: analytics.activeUsers },
                    { label: 'Searches (7d)', value: analytics.searchesLast7d },
                    { label: 'Crashes (7d)', value: analytics.crashesLast7d },
                    { label: 'AI Usage (7d)', value: analytics.aiUsageLast7d },
                    { label: 'Feedback (7d)', value: analytics.feedbackLast7d }
                  ].map((s) => (
                    <div key={s.label} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <p className="text-2xl font-bold text-nova-400">{s.value ?? 0}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sign in to Nova Cloud to view analytics.</p>
              )}
            </div>
          )}

          {tab === 'feedback' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-xl font-semibold text-white">Feedback & Bug Reports</h3>
              <textarea value={feedbackMsg} onChange={(e) => setFeedbackMsg(e.target.value)} placeholder="Tell us what you think or report a bug..." rows={4} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm resize-none" />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setFeedbackRating(n)} className={`w-8 h-8 rounded-lg text-sm ${feedbackRating >= n ? 'text-yellow-400' : 'text-gray-600'}`}>★</button>
                ))}
              </div>
              <button onClick={async () => { const r = await window.novaAPI.feedback.submit({ message: feedbackMsg, rating: feedbackRating, category: 'beta' }); setMsg(r.message || 'Sent!'); setFeedbackMsg(''); }} className="w-full py-2.5 bg-nova-500 text-white rounded-xl text-sm">Submit Feedback</button>
            </div>
          )}

          {tab === 'vpn' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-white">Nova VPN</h3>
              <div className={`p-4 rounded-xl border ${vpnStatus?.connected ? 'border-green-500/40 bg-green-500/10' : 'border-white/10 bg-white/5'}`}>
                <p className="text-sm text-white">{vpnStatus?.connected ? '🟢 Connected' : '⚪ Disconnected'}</p>
                <p className="text-xs text-gray-400 mt-1">{vpnStatus?.message}</p>
                {vpnStatus?.tunnelName && <p className="text-xs text-gray-500 mt-1">Tunnel: {vpnStatus.tunnelName}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={async () => { const r = await window.novaAPI.vpn.importConfig(); setMsg(r.success ? 'Config imported' : r.error || 'Cancelled'); window.novaAPI.vpn.getStatus().then(setVpnStatus); }} className="px-4 py-2 bg-white/10 rounded-xl text-sm">Import .conf</button>
                <button onClick={async () => { const r = await window.novaAPI.vpn.connect(); setMsg(r.message || r.error || 'Done'); window.novaAPI.vpn.getStatus().then(setVpnStatus); }} className="px-4 py-2 bg-nova-500 text-white rounded-xl text-sm">Connect</button>
                <button onClick={async () => { await window.novaAPI.vpn.disconnect(); window.novaAPI.vpn.getStatus().then(setVpnStatus); setMsg('Disconnected'); }} className="px-4 py-2 bg-white/10 rounded-xl text-sm">Disconnect</button>
              </div>
              {vpnServers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Nova VPN Servers (sign in required)</p>
                  {vpnServers.map((s) => (
                    <button key={s.id} onClick={async () => { const r = await window.novaAPI.vpn.useServer(s.id); setMsg(r.success ? `Using ${s.name}` : r.error || 'Failed'); }} className="w-full text-left p-3 bg-white/5 rounded-xl border border-white/10 hover:border-nova-500/30">
                      <span className="text-sm text-white">{s.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{s.country} · {s.city} · load {s.load}%</span>
                    </button>
                  ))}
                </div>
              )}
              {!vpnStatus?.wireguardInstalled && (
                <button onClick={() => window.novaAPI.shell.openExternal('https://www.wireguard.com/install/')} className="text-xs text-nova-400 hover:underline">Install WireGuard for Windows</button>
              )}
            </div>
          )}

          {tab === 'email' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-xl font-semibold text-white">Nova Email</h3>
              <button onClick={async () => { const r = await window.novaAPI.email.getInbox(); setInbox(r); setMsg(''); }} disabled={!account?.cloud} className="px-4 py-2 bg-nova-500/20 text-nova-400 rounded-xl text-sm disabled:opacity-40">Load Inbox</button>
              {inbox.alias && <p className="text-xs text-gray-400">Your address: <span className="text-nova-400">{inbox.alias}</span></p>}
              <div className="space-y-2">
                <input value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="To" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm" />
                <input value={mailSubject} onChange={(e) => setMailSubject(e.target.value)} placeholder="Subject" className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm" />
                <textarea value={mailBody} onChange={(e) => setMailBody(e.target.value)} placeholder="Message" rows={4} className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-sm resize-none" />
                <button onClick={async () => { const r = await window.novaAPI.email.send({ to: mailTo, subject: mailSubject, body: mailBody }); setMsg(r.success ? 'Email sent' : r.error || 'Failed'); }} className="w-full py-2.5 bg-nova-500 text-white rounded-xl text-sm">Send Email</button>
              </div>
              {inbox.messages?.map((m) => (
                <div key={m.id} className="p-3 bg-white/5 rounded-xl text-xs">
                  <p className="text-white font-medium">{m.subject}</p>
                  <p className="text-gray-500">{m.from_addr} → {m.to_addr}</p>
                  <p className="text-gray-400 mt-1 line-clamp-2">{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'drive' && (
            <div className="space-y-4 max-w-lg">
              <h3 className="text-xl font-semibold text-white">Nova Drive</h3>
              <div className="flex gap-2">
                <button onClick={async () => { const r = await window.novaAPI.drive.list(); setDriveFiles(r.files || []); }} disabled={!account?.cloud} className="px-4 py-2 bg-nova-500/20 text-nova-400 rounded-xl text-sm disabled:opacity-40">Refresh</button>
                <button onClick={async () => {
                  const r = await window.novaAPI.dialog.openFile({ properties: ['openFile'] });
                  if (r.canceled || !r.filePaths?.[0]) return;
                  const up = await window.novaAPI.drive.uploadFile(r.filePaths[0]);
                  setMsg(up.success ? 'Uploaded' : up.error || 'Failed');
                  const list = await window.novaAPI.drive.list();
                  setDriveFiles(list.files || []);
                }} disabled={!account?.cloud} className="px-4 py-2 bg-white/10 rounded-xl text-sm disabled:opacity-40">Upload File</button>
              </div>
              {driveFiles.map((f) => (
                <div key={f.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl text-sm">
                  <span>{f.filename}</span>
                  <span className="text-xs text-gray-500">{(f.size_bytes / 1024).toFixed(1)} KB</span>
                </div>
              ))}
              {!account?.cloud && <p className="text-xs text-gray-500">Sign in to Nova Cloud to use Drive.</p>}
            </div>
          )}

          {tab === 'services' && (
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">Nova Cloud Platform</h3>
              {[
                { name: 'Nova Cloud API', desc: 'Auth, sync, search — live on localhost:3847', icon: '☁️', active: true },
                { name: 'Nova Search Index', desc: 'Own crawler index merged with search', icon: '🔍', active: true },
                { name: 'Nova Email', desc: 'Inbox + send — Nova Hub → Email tab', icon: '📧', active: true },
                { name: 'Nova Drive', desc: 'Cloud file storage — 5GB free tier', icon: '💾', active: true },
                { name: 'Nova VPN', desc: 'WireGuard servers + import config', icon: '🛡️', active: true }
              ].map((s) => (
                <div key={s.name} className={`p-4 rounded-xl border ${s.active ? 'border-nova-500/30 bg-nova-500/5' : 'border-white/10'}`}>
                  <p className="font-medium text-white">{s.icon} {s.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
                </div>
              ))}
            </div>
          )}

          {tab === 'update' && (
            <div className="space-y-4 max-w-md">
              <h3 className="text-xl font-semibold text-white">Updates</h3>
              <button onClick={async () => { const r = await window.novaAPI.update.check(); setMsg(r?.error || 'Checking...'); }} className="w-full py-2.5 bg-nova-500 text-white rounded-xl text-sm">Check for Updates</button>
              <button onClick={() => window.novaAPI.update.install()} className="w-full py-2.5 bg-white/10 rounded-xl text-sm">Install & Restart</button>
            </div>
          )}

          {msg && <p className="text-xs text-nova-400 mt-4 p-2 bg-nova-500/10 rounded-lg">{msg}</p>}
        </div>
      </div>
    </div>
  );
}

export default NovaHubPanel;
