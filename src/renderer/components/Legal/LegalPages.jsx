import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { closeLegal } from '../../store/slices/uiSlice';

const SECTIONS = {
  about: {
    title: 'About Nova Browser',
    content: `Nova Browser v2.0 — Privacy-first, AI-powered browsing by Nova Team.

Built on Electron + Chromium engine with Nova's own search, cloud sync, and AI platform.

© 2026 Nova Browser. MIT License.`
  },
  privacy: {
    title: 'Privacy Policy',
    content: `Nova Browser Privacy Policy (Beta)

We collect minimal data:
• Crash reports (optional, anonymized)
• Feedback you submit
• Nova Cloud account data (if you sign up)

We do NOT sell your data. Search queries are processed via Nova Search API with caching. Passwords are encrypted locally and in cloud sync.

Contact: privacy@novabrowser.app`
  },
  terms: {
    title: 'Terms of Service',
    content: `Nova Browser Terms of Service (Beta)

By using Nova Browser you agree to use it lawfully. Nova Cloud accounts are for personal use. We may update these terms as we move to public beta.

Nova Browser is provided "as is" during beta.`
  },
  release: {
    title: 'Release Notes v2.0',
    content: `Nova Browser v2.0 — Beta Release

NEW:
• Nova Cloud backend (auth, sync, PostgreSQL)
• Nova Account with JWT sessions
• Cloud sync: bookmarks, history, passwords, settings, tabs, AI chats
• Nova Store for extensions
• Nova AI Pro: Research, Explain, Rewrite, YouTube/PDF summarize
• Nova Search API layer with caching & trending
• Feedback & crash reporting
• Nova Mobile scaffold (React Native)

IMPROVED:
• Search link navigation fix
• Nova Hub redesign
• Full sync restore (history, passwords, addresses)`
  }
};

function LegalPages() {
  const dispatch = useDispatch();
  const open = useSelector((state) => state.ui.legalOpen);
  const section = useSelector((state) => state.ui.legalSection);
  const data = SECTIONS[section] || SECTIONS.about;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => dispatch(closeLegal())} />
      <div className="relative w-[560px] max-h-[80vh] bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-6 overflow-y-auto">
        <button onClick={() => dispatch(closeLegal())} className="absolute top-4 right-4 text-gray-400">✕</button>
        <h2 className="text-xl font-bold mb-4">{data.title}</h2>
        <pre className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{data.content}</pre>
      </div>
    </div>
  );
}

export default LegalPages;
