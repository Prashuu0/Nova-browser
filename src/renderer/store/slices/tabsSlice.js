import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import {
  getPageType,
  externalSearchToNova,
  parseNovaSearchUrl
} from '../../utils/novaUrls';

function applyUrlToTab(tab, url) {
  tab.url = url;
  tab.pageType = getPageType(url);
  tab.isNewTab = tab.pageType === 'newtab';
  tab.hasError = false;
  tab.discarded = false;
  if (tab.pageType === 'search') {
    const { query } = parseNovaSearchUrl(url);
    tab.title = query ? `${query} - Nova Search` : 'Nova Search';
  }
  if (tab.pageType === 'web' && url.startsWith('http')) {
    tab.loadKey = (tab.loadKey || 0) + 1;
  }
}

function pushNavHistory(tab, newUrl) {
  if (!newUrl || newUrl === tab.url) return;
  if (!tab.navHistory) {
    tab.navHistory = [tab.url];
    tab.navIndex = 0;
  }
  tab.navHistory = tab.navHistory.slice(0, tab.navIndex + 1);
  if (tab.navHistory[tab.navIndex] !== newUrl) {
    tab.navHistory.push(newUrl);
    tab.navIndex = tab.navHistory.length - 1;
  }
  tab.canGoBack = tab.navIndex > 0;
  tab.canGoForward = false;
}

export const createNewTab = createAsyncThunk('tabs/createNewTab', async (url) => {
  const resolved = url
    ? await window.novaAPI.navigation.resolveUrl(url)
    : { url: 'nova://newtab', type: 'newtab', pageType: 'newtab' };
  return resolved;
});

const tabsSlice = createSlice({
  name: 'tabs',
  initialState: {
    tabs: [],
    activeTabId: null,
    windowId: null,
    isIncognito: false
  },
  reducers: {
    initWindow: (state, action) => {
      const incognito = action.payload.isIncognito || false;
      state.windowId = action.payload.windowId;
      state.isIncognito = incognito;

      if (incognito) {
        const id = uuidv4();
        state.tabs = [{
          id,
          title: 'New Incognito Tab',
          url: 'nova://newtab',
          favicon: null,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isNewTab: true,
          pageType: 'newtab',
          navHistory: ['nova://newtab'],
          navIndex: 0
        }];
        state.activeTabId = id;
        return;
      }

      if (state.tabs.length === 0) {
        const id = uuidv4();
        state.tabs.push({
          id,
          title: 'New Tab',
          url: 'nova://newtab',
          favicon: null,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isNewTab: true,
          pageType: 'newtab',
          navHistory: ['nova://newtab'],
          navIndex: 0
        });
        state.activeTabId = id;
      }
    },
    addTab: (state, action) => {
      const id = uuidv4();
      const url = action.payload.url || 'nova://newtab';
      const tab = {
        id,
        title: action.payload.title || 'New Tab',
        url,
        favicon: action.payload.favicon || null,
        isLoading: false,
        canGoBack: false,
        canGoForward: false,
        isNewTab: url === 'nova://newtab' || !action.payload.url,
        pageType: action.payload.pageType || getPageType(url),
        navHistory: [url],
        navIndex: 0
      };
      state.tabs.push(tab);
      state.activeTabId = id;
    },
    closeTab: (state, action) => {
      const index = state.tabs.findIndex((t) => t.id === action.payload);
      if (index === -1) return;
      state.tabs.splice(index, 1);
      if (state.tabs.length === 0) {
        const id = uuidv4();
        state.tabs.push({
          id,
          title: state.isIncognito ? 'New Incognito Tab' : 'New Tab',
          url: 'nova://newtab',
          favicon: null,
          isLoading: false,
          canGoBack: false,
          canGoForward: false,
          isNewTab: true,
          pageType: 'newtab',
          navHistory: ['nova://newtab'],
          navIndex: 0
        });
        state.activeTabId = id;
      } else if (state.activeTabId === action.payload) {
        const newIndex = Math.min(index, state.tabs.length - 1);
        state.activeTabId = state.tabs[newIndex].id;
      }
    },
    setActiveTab: (state, action) => {
      state.activeTabId = action.payload;
      const next = state.tabs.find((t) => t.id === action.payload);
      if (next) next.discarded = false;
    },
    goBack: (state) => {
      const tab = state.tabs.find((t) => t.id === state.activeTabId);
      if (!tab?.navHistory || tab.navIndex <= 0) return;
      tab.navIndex -= 1;
      applyUrlToTab(tab, tab.navHistory[tab.navIndex]);
      tab.canGoBack = tab.navIndex > 0;
      tab.canGoForward = tab.navIndex < tab.navHistory.length - 1;
    },
    goForward: (state) => {
      const tab = state.tabs.find((t) => t.id === state.activeTabId);
      if (!tab?.navHistory || tab.navIndex >= tab.navHistory.length - 1) return;
      tab.navIndex += 1;
      applyUrlToTab(tab, tab.navHistory[tab.navIndex]);
      tab.canGoBack = tab.navIndex > 0;
      tab.canGoForward = tab.navIndex < tab.navHistory.length - 1;
    },
    updateTab: (state, action) => {
      const tab = state.tabs.find((t) => t.id === action.payload.id);
      if (tab) {
        const payload = { ...action.payload };
        if (payload.url) {
          const novaUrl = externalSearchToNova(payload.url);
          if (novaUrl) {
            payload.url = novaUrl;
            payload.pageType = 'search';
            const { query } = parseNovaSearchUrl(novaUrl);
            payload.title = `${query} - Nova Search`;
            payload.isNewTab = false;
          }
        }

        if (payload.url && payload.url !== tab.url && !payload.isHistoryNavigation) {
          pushNavHistory(tab, payload.url);
        }

        if (payload.isHistoryNavigation) delete payload.isHistoryNavigation;
        const prevUrl = tab.url;
        Object.assign(tab, payload);

        if (payload.url) {
          tab.pageType = getPageType(payload.url);
          tab.isNewTab = tab.pageType === 'newtab';
          tab.discarded = false;
          tab.hasError = false;
          if (tab.pageType === 'web' && payload.url !== prevUrl && payload.loadKey == null) {
            tab.loadKey = (tab.loadKey || 0) + 1;
          }
          if (tab.pageType === 'search') {
            const { query } = parseNovaSearchUrl(payload.url);
            tab.title = query ? `${query} - Nova Search` : 'Nova Search';
          }
        }
      }
    },
    reorderTabs: (state, action) => {
      const { fromIndex, toIndex } = action.payload;
      const [removed] = state.tabs.splice(fromIndex, 1);
      state.tabs.splice(toIndex, 0, removed);
    },
    duplicateTab: (state, action) => {
      const tab = state.tabs.find((t) => t.id === action.payload);
      if (!tab) return;
      const id = uuidv4();
      state.tabs.push({ ...tab, id, navHistory: [...(tab.navHistory || [tab.url])], navIndex: tab.navIndex || 0 });
      state.activeTabId = id;
    },
    pinTab: (state, action) => {
      const tab = state.tabs.find((t) => t.id === action.payload);
      if (tab) tab.pinned = !tab.pinned;
      state.tabs.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    },
    closeOtherTabs: (state, action) => {
      const keepId = action.payload;
      state.tabs = state.tabs.filter((t) => t.id === keepId || t.pinned);
      state.activeTabId = keepId;
    },
    restoreTabs: (state, action) => {
      state.tabs = action.payload.tabs.map((tab) => {
        const novaUrl = externalSearchToNova(tab.url);
        if (novaUrl) {
          const { query } = parseNovaSearchUrl(novaUrl);
          return {
            ...tab,
            url: novaUrl,
            pageType: 'search',
            title: `${query} - Nova Search`,
            isNewTab: false,
            navHistory: tab.navHistory || [novaUrl],
            navIndex: tab.navIndex ?? 0
          };
        }
        return {
          ...tab,
          pageType: tab.pageType || getPageType(tab.url),
          navHistory: tab.navHistory || [tab.url],
          navIndex: tab.navIndex ?? 0
        };
      });
      state.activeTabId = action.payload.activeTabId;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(createNewTab.fulfilled, (state, action) => {
      const id = uuidv4();
      state.tabs.push({
        id,
        title: action.payload.type === 'search' ? action.payload.query : 'New Tab',
        url: action.payload.url,
        favicon: null,
        isLoading: true,
        canGoBack: false,
        canGoForward: false,
        isNewTab: action.payload.pageType === 'newtab',
        pageType: action.payload.pageType || getPageType(action.payload.url),
        navHistory: [action.payload.url],
        navIndex: 0
      });
      state.activeTabId = id;
    });
  }
});

export const {
  initWindow,
  addTab,
  closeTab,
  setActiveTab,
  updateTab,
  goBack,
  goForward,
  reorderTabs,
  restoreTabs,
  duplicateTab,
  pinTab,
  closeOtherTabs
} = tabsSlice.actions;

export const selectActiveTab = (state) =>
  state.tabs.tabs.find((t) => t.id === state.tabs.activeTabId);

export default tabsSlice.reducer;
