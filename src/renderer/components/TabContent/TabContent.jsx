import React from 'react';
import { useSelector } from 'react-redux';
import { resolveTabPageType } from '../../utils/novaUrls';
import NewTabPage from '../NewTabPage/NewTabPage';
import NovaSearchPage from '../NovaSearch/NovaSearchPage';
import WebViewContainer from '../WebView/WebViewContainer';
import ReaderView from '../ReaderMode/ReaderView';

function TabContent() {
  const { tabs, activeTabId } = useSelector((state) => state.tabs);
  const readerMode = useSelector((state) => state.ui.readerMode);
  const readerContent = useSelector((state) => state.ui.readerContent);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) return null;

  const pageType = resolveTabPageType(activeTab);
  const isWeb = pageType === 'web';

  return (
    <div className="flex-1 flex flex-col min-h-0 w-full overflow-hidden relative bg-[#202124]">
      {/* Web layer — always mounted; search/newtab overlay sits on top */}
      <div className="absolute inset-0 flex flex-col min-h-0 z-0">
        <WebViewContainer />
        {readerMode && readerContent && isWeb && <ReaderView content={readerContent} />}
      </div>

      {pageType === 'newtab' && (
        <div className="absolute inset-0 z-20 flex flex-col min-h-0 overflow-hidden">
          <NewTabPage tabId={activeTab.id} />
        </div>
      )}

      {pageType === 'search' && (
        <div className="absolute inset-0 z-20 flex flex-col min-h-0 overflow-hidden">
          <NovaSearchPage tabId={activeTab.id} url={activeTab.url} />
        </div>
      )}
    </div>
  );
}

export default TabContent;
