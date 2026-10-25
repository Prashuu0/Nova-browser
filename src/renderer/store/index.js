import { configureStore } from '@reduxjs/toolkit';
import tabsReducer from './slices/tabsSlice';
import bookmarksReducer from './slices/bookmarksSlice';
import historyReducer from './slices/historySlice';
import downloadsReducer from './slices/downloadsSlice';
import settingsReducer from './slices/settingsSlice';
import passwordsReducer from './slices/passwordsSlice';
import aiReducer from './slices/aiSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    tabs: tabsReducer,
    bookmarks: bookmarksReducer,
    history: historyReducer,
    downloads: downloadsReducer,
    settings: settingsReducer,
    passwords: passwordsReducer,
    ai: aiReducer,
    ui: uiReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false
    })
});

export default store;
