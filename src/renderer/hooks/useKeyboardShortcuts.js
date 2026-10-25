import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTab, closeTab, updateTab, setActiveTab } from '../store/slices/tabsSlice';
import { setFindInPage } from '../store/slices/uiSlice';
import { getTabWebContentsId } from '../utils/tabBrowser';

export function useKeyboardShortcuts(inputRef) {
  const dispatch = useDispatch();
  const { tabs, activeTabId } = useSelector((state) => state.tabs);
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const defaultZoom = useSelector((state) => state.settings.data.defaultZoom) || 100;

  const applyZoom = useCallback(async (factor) => {
    const webContentsId = await getTabWebContentsId(activeTabId);
    if (webContentsId) {
      window.novaAPI.browser.setZoom(webContentsId, factor);
      dispatch(updateTab({ id: activeTabId, zoom: Math.round(factor * 100) }));
    }
  }, [activeTabId, dispatch]);

  useEffect(() => {
    const handler = async (e) => {
      const ctrl = e.ctrlKey || e.metaKey;

      if (ctrl && e.key === 't') {
        e.preventDefault();
        dispatch(addTab({ url: 'nova://newtab' }));
      }
      if (ctrl && e.key === 'w') {
        e.preventDefault();
        dispatch(closeTab(activeTabId));
      }
      if (ctrl && e.key === 'l') {
        e.preventDefault();
        inputRef?.current?.focus();
        inputRef?.current?.select();
      }
      if (ctrl && e.key === 'r') {
        e.preventDefault();
        if (activeTab) {
          dispatch(updateTab({ id: activeTabId, loadKey: (activeTab.loadKey || 0) + 1, isLoading: true }));
          window.novaAPI.tabBrowser.reload(activeTabId);
        }
      }
      if (ctrl && e.key === 'f') {
        e.preventDefault();
        dispatch(setFindInPage({ open: true }));
      }
      if (ctrl && e.key === 'p') {
        e.preventDefault();
        const webContentsId = await getTabWebContentsId(activeTabId);
        if (webContentsId) window.novaAPI.browser.print(webContentsId);
      }
      if (e.key === 'F12') {
        e.preventDefault();
        const webContentsId = await getTabWebContentsId(activeTabId);
        if (webContentsId) window.novaAPI.browser.openDevTools(webContentsId);
      }
      if (ctrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        const current = (activeTab?.zoom || defaultZoom) / 100;
        applyZoom(Math.min(current + 0.1, 3));
      }
      if (ctrl && e.key === '-') {
        e.preventDefault();
        const current = (activeTab?.zoom || defaultZoom) / 100;
        applyZoom(Math.max(current - 0.1, 0.5));
      }
      if (ctrl && e.key === '0') {
        e.preventDefault();
        applyZoom(defaultZoom / 100);
      }
      if (ctrl && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        window.novaAPI.window.newIncognito();
      }
      if (e.altKey && e.key === 'r') {
        e.preventDefault();
        document.querySelector('[title="Reader Mode"]')?.click();
      }
      if (ctrl && e.key >= '1' && e.key <= '9') {
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
          e.preventDefault();
          dispatch(setActiveTab(tabs[idx].id));
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dispatch, activeTabId, activeTab, tabs, inputRef, applyZoom, defaultZoom]);
}
