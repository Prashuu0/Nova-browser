import React from 'react';
import { useDispatch } from 'react-redux';
import { toggleReaderMode, setReaderContent } from '../../store/slices/uiSlice';

function ReaderView({ content }) {
  const dispatch = useDispatch();

  if (!content) return null;

  const close = () => {
    dispatch(toggleReaderMode());
    dispatch(setReaderContent(null));
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#1a1a2e] overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-[#1a1a2e]/95 backdrop-blur border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-nova-400 text-xs font-medium uppercase tracking-wider">Reader</span>
          <h1 className="text-white font-semibold truncate">{content.title}</h1>
        </div>
        <button
          onClick={close}
          className="px-4 py-2 text-sm text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg"
        >
          Exit Reader
        </button>
      </div>
      <article className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">{content.title}</h1>
        {content.url && (
          <p className="text-nova-400 text-sm mb-8 truncate">{content.url}</p>
        )}
        <div
          className="reader-content text-gray-300 text-lg leading-relaxed space-y-4 prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitizeReaderHtml(content.html) }}
        />
        {!content.html && content.text && (
          <div className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">{content.text}</div>
        )}
      </article>
    </div>
  );
}

function sanitizeReaderHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '');
}

export default ReaderView;
