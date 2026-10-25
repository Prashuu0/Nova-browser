import React from 'react';

function WebLandingPage() {
  const features = [
    { icon: '🔒', title: 'Privacy First', desc: 'Ad blocker, tracker blocker, and privacy dashboard built-in.' },
    { icon: '🤖', title: 'AI Powered', desc: 'Built-in AI assistant with OpenAI, Gemini, and Ollama support.' },
    { icon: '⚡', title: 'Fast & Modern', desc: 'Chromium-based engine with a beautiful, modern interface.' },
    { icon: '🪟', title: 'Windows Native', desc: 'Desktop app for Windows with installer and portable builds.' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-nova-950 via-surface-darker to-nova-900 text-white">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nova-400 to-nova-600 flex items-center justify-center shadow-lg">
            <span className="font-bold text-lg">N</span>
          </div>
          <span className="text-xl font-semibold">Nova Browser</span>
        </div>
        <a
          href="https://github.com"
          className="text-sm text-white/70 hover:text-white transition-colors"
        >
          GitHub
        </a>
      </nav>

      <main className="max-w-5xl mx-auto px-8 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nova-500/20 text-nova-300 text-sm mb-8 border border-nova-500/30">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Desktop Browser — Windows
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Browse Smarter with
          <span className="block bg-gradient-to-r from-nova-400 to-purple-400 bg-clip-text text-transparent">
            Nova Browser
          </span>
        </h1>

        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          A privacy-focused, AI-powered desktop browser built with Electron and Chromium.
          Download Nova Browser for your Windows PC below.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
          <a
            href="/downloads/NovaBrowser-Setup.exe"
            download="NovaBrowser-Setup.exe"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-nova-500 to-purple-600 hover:from-nova-600 hover:to-purple-700 rounded-xl font-semibold text-lg shadow-xl shadow-nova-500/30 transition-all transform hover:-translate-y-0.5 inline-flex items-center justify-center gap-3 text-white no-underline"
          >
            <span className="text-xl">⬇</span>
            <span>Download for Windows (.exe)</span>
          </a>
          <a
            href="/downloads/NovaBrowser-Portable-1.0.0.exe"
            download="NovaBrowser-Portable-1.0.0.exe"
            className="w-full sm:w-auto px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-base border border-white/20 transition-all inline-flex items-center justify-center gap-2 text-white/90 no-underline"
          >
            <span>📦 Portable Edition</span>
          </a>
          <a
            href="#features"
            className="w-full sm:w-auto px-6 py-4 bg-white/5 hover:bg-white/15 rounded-xl font-semibold text-base border border-white/10 transition-colors text-white/70 hover:text-white"
          >
            Learn More
          </a>
        </div>

        <p className="text-sm text-white/50 mb-16">
          Version 1.0.0 • Windows 10/11 (64-bit) • ~76 MB
        </p>

        <div id="features" className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-white/60 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-8 text-white/30 text-sm border-t border-white/10">
        © 2026 Nova Browser — Privacy-focused AI Desktop Browser
      </footer>
    </div>
  );
}

export default WebLandingPage;
