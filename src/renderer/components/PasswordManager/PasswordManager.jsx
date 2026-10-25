import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { togglePanel, fetchPasswords, savePassword, removePassword } from '../../store/slices/passwordsSlice';

function PasswordManager() {
  const dispatch = useDispatch();
  const { items, panelOpen } = useSelector((state) => state.passwords);
  const [showAdd, setShowAdd] = useState(false);
  const [revealedId, setRevealedId] = useState(null);
  const [revealedPassword, setRevealedPassword] = useState('');
  const [form, setForm] = useState({ origin: '', username: '', password: '' });

  useEffect(() => {
    if (panelOpen) dispatch(fetchPasswords());
  }, [panelOpen, dispatch]);

  if (!panelOpen) return null;

  const handleSave = async () => {
    if (!form.origin || !form.username || !form.password) return;
    dispatch(savePassword(form));
    setForm({ origin: '', username: '', password: '' });
    setShowAdd(false);
  };

  const handleGenerate = async () => {
    const password = await window.novaAPI.passwords.generate(16);
    setForm((f) => ({ ...f, password }));
    setShowAdd(true);
  };

  const handleReveal = async (id) => {
    if (revealedId === id) {
      setRevealedId(null);
      setRevealedPassword('');
      return;
    }
    const data = await window.novaAPI.passwords.get(id);
    setRevealedId(id);
    setRevealedPassword(data?.password || '');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(togglePanel())} />
      <div className="relative w-[600px] max-h-[500px] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl flex flex-col animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-nova-500">
              <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 2a3 3 0 013 3v2H7V7a3 3 0 013-3zm-3 7h6v3H7v-3z" />
            </svg>
            <h2 className="font-semibold">Password Manager</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Generate
            </button>
            <button
              onClick={() => setShowAdd(!showAdd)}
              className="px-3 py-1.5 bg-nova-500 text-white text-sm rounded-lg hover:bg-nova-600 transition-colors"
            >
              Add Password
            </button>
            <button onClick={() => dispatch(togglePanel())} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                <path d="M1 0L0 1l6 6-6 6 1 1 6-6 6 6 1-1-6-6 6-6-1-1-6 6z" />
              </svg>
            </button>
          </div>
        </div>

        {showAdd && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
            <input
              placeholder="Website (e.g. https://example.com)"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
            />
            <input
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
            />
            <button onClick={handleSave} className="px-4 py-2 bg-nova-500 text-white text-sm rounded-lg hover:bg-nova-600">
              Save
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No saved passwords. Passwords are encrypted using your OS keychain.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <div className="w-8 h-8 rounded-lg bg-nova-500/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-nova-500 text-xs font-bold">{item.origin[8]?.toUpperCase() || 'W'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{item.origin}</div>
                  <div className="text-xs text-gray-400">{item.username}</div>
                  {revealedId === item.id && (
                    <div className="text-xs font-mono mt-1 text-nova-600 dark:text-nova-400">{revealedPassword}</div>
                  )}
                </div>
                <button
                  onClick={() => handleReveal(item.id)}
                  className="text-xs text-gray-500 hover:text-nova-500 px-2 py-1"
                >
                  {revealedId === item.id ? 'Hide' : 'Show'}
                </button>
                <button
                  onClick={() => dispatch(removePassword(item.id))}
                  className="text-xs text-red-500 hover:text-red-600 px-2 py-1"
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default PasswordManager;
