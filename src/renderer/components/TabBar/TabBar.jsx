import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTab, closeTab, setActiveTab, reorderTabs, duplicateTab, pinTab, closeOtherTabs } from '../../store/slices/tabsSlice';

function TabBar() {
  const dispatch = useDispatch();
  const { tabs, activeTabId, isIncognito } = useSelector((state) => state.tabs);
  const dragTab = useRef(null);
  const dragOver = useRef(null);
  const [menu, setMenu] = useState(null);

  const handleDragStart = (e, index) => {
    dragTab.current = index;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOver.current = index;
  };

  const handleDrop = () => {
    if (dragTab.current !== null && dragOver.current !== null && dragTab.current !== dragOver.current) {
      dispatch(reorderTabs({ fromIndex: dragTab.current, toIndex: dragOver.current }));
    }
    dragTab.current = null;
    dragOver.current = null;
  };

  const openMenu = (e, tab) => {
    e.preventDefault();
    setMenu({ x: e.clientX, y: e.clientY, tab });
  };

  return (
    <div className={`flex items-center h-9 px-1 gap-0.5 ${isIncognito ? 'bg-gray-900' : 'bg-[#12121f]'}`}>
      {isIncognito && (
        <div className="flex items-center gap-1 px-2 text-xs text-gray-400">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
          </svg>
          Incognito
        </div>
      )}
      <div className="flex items-center flex-1 overflow-x-auto scrollbar-thin gap-0.5">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            draggable={!tab.pinned}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onClick={() => dispatch(setActiveTab(tab.id))}
            onContextMenu={(e) => openMenu(e, tab)}
            className={`group flex items-center gap-1.5 h-8 px-3 rounded-t-xl cursor-pointer transition-all duration-200 no-drag ${
              tab.pinned ? 'min-w-[40px] max-w-[40px] px-2' : 'min-w-[120px] max-w-[220px]'
            } ${
              tab.id === activeTabId
                ? 'bg-[#1a1a2e] dark:bg-[#1a1a2e] text-white border-t-2 border-nova-500 shadow-lg shadow-nova-500/10'
                : 'bg-transparent text-gray-500 hover:bg-white/10 dark:hover:bg-white/5'
            }`}
          >
            {tab.isLoading ? (
              <div className="w-3.5 h-3.5 border-2 border-nova-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            ) : tab.favicon ? (
              <img src={tab.favicon} alt="" className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-full bg-nova-500/20 flex-shrink-0" />
            )}
            {!tab.pinned && (
              <span className="text-xs truncate flex-1">{tab.title || 'New Tab'}</span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.novaAPI?.tabBrowser?.remove(tab.id);
                dispatch(closeTab(tab.id));
              }}
              className="w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all flex-shrink-0"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                <path d="M1 0L0 1l3 3-3 3 1 1 3-3 3 3 1-1-3-3 3-3-1-1-3 3z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => dispatch(addTab({ url: 'nova://newtab' }))}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/50 dark:hover:bg-white/10 transition-colors no-drag flex-shrink-0"
        title="New Tab (Ctrl+T)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {menu && (
        <>
          <div className="fixed inset-0 z-50" onClick={() => setMenu(null)} />
          <div
            className="fixed z-50 bg-white dark:bg-[#2b2d31] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl py-1 min-w-[160px]"
            style={{ left: menu.x, top: menu.y }}
          >
            <MenuItem label="Reload" onClick={() => { setMenu(null); }} />
            <MenuItem label="Duplicate tab" onClick={() => { dispatch(duplicateTab(menu.tab.id)); setMenu(null); }} />
            <MenuItem label={menu.tab.pinned ? 'Unpin tab' : 'Pin tab'} onClick={() => { dispatch(pinTab(menu.tab.id)); setMenu(null); }} />
            <MenuItem label="Close tab" onClick={() => { dispatch(closeTab(menu.tab.id)); setMenu(null); }} />
            <MenuItem label="Close other tabs" onClick={() => { dispatch(closeOtherTabs(menu.tab.id)); setMenu(null); }} />
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
    >
      {label}
    </button>
  );
}

export default TabBar;
