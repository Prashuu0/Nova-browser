import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    readerMode: false,
    screenshotMode: false,
    translationPanel: false,
    privacyDashboard: false,
    securityDashboard: false,
    bookmarkBarVisible: true,
    fullscreen: false,
    offline: !navigator.onLine,
    findInPageOpen: false,
    findMatch: { active: 0, total: 0 },
    shieldStats: {
      totalBlocked: 0,
      trackersBlocked: 0,
      adsBlocked: 0,
      bytesSaved: 0,
      bandwidthSaved: '0 B'
    },
    pendingPassword: null,
    readerContent: null,
    filterStats: { adDomains: 0, trackerDomains: 0, lastUpdated: null },
    novaHubOpen: false,
    shieldsMenuOpen: false,
    updateAvailable: null,
    legalOpen: false,
    legalSection: 'about'
  },
  reducers: {
    toggleReaderMode: (state) => {
      state.readerMode = !state.readerMode;
    },
    toggleScreenshotMode: (state) => {
      state.screenshotMode = !state.screenshotMode;
    },
    toggleTranslationPanel: (state) => {
      state.translationPanel = !state.translationPanel;
    },
    togglePrivacyDashboard: (state) => {
      state.privacyDashboard = !state.privacyDashboard;
    },
    toggleSecurityDashboard: (state) => {
      state.securityDashboard = !state.securityDashboard;
    },
    setBookmarkBarVisible: (state, action) => {
      state.bookmarkBarVisible = action.payload;
    },
    setFullscreen: (state, action) => {
      state.fullscreen = action.payload;
    },
    setOffline: (state, action) => {
      state.offline = action.payload;
    },
    setFindInPage: (state, action) => {
      if (action.payload.open !== undefined) state.findInPageOpen = action.payload.open;
      if (action.payload.match) state.findMatch = action.payload.match;
    },
    setShieldStats: (state, action) => {
      state.shieldStats = action.payload;
    },
    setPendingPassword: (state, action) => {
      state.pendingPassword = action.payload;
    },
    clearPendingPassword: (state) => {
      state.pendingPassword = null;
    },
    setReaderContent: (state, action) => {
      state.readerContent = action.payload;
    },
    setFilterStats: (state, action) => {
      state.filterStats = action.payload;
    },
    setNovaHubOpen: (state, action) => {
      state.novaHubOpen = action.payload;
    },
    toggleNovaHub: (state) => {
      state.novaHubOpen = !state.novaHubOpen;
    },
    setShieldsMenuOpen: (state, action) => {
      state.shieldsMenuOpen = action.payload;
    },
    setUpdateAvailable: (state, action) => {
      state.updateAvailable = action.payload;
    },
    openLegal: (state, action) => {
      state.legalOpen = true;
      state.legalSection = action.payload || 'about';
    },
    closeLegal: (state) => {
      state.legalOpen = false;
    }
  }
});

export const {
  toggleReaderMode,
  toggleScreenshotMode,
  toggleTranslationPanel,
  togglePrivacyDashboard,
  toggleSecurityDashboard,
  setBookmarkBarVisible,
  setFullscreen,
  setOffline,
  setFindInPage,
  setShieldStats,
  setPendingPassword,
  clearPendingPassword,
  setReaderContent,
  setFilterStats,
  setNovaHubOpen,
  toggleNovaHub,
  setShieldsMenuOpen,
  setUpdateAvailable,
  openLegal,
  closeLegal
} = uiSlice.actions;

export default uiSlice.reducer;
