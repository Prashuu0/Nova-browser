import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchHistory = createAsyncThunk('history/fetchAll', async (options) => {
  return window.novaAPI.history.getAll(options);
});

export const addHistoryEntry = createAsyncThunk('history/add', async (entry) => {
  return window.novaAPI.history.add(entry);
});

export const clearHistory = createAsyncThunk('history/clear', async () => {
  await window.novaAPI.history.clear();
});

export const fetchRecentHistory = createAsyncThunk('history/fetchRecent', async (limit) => {
  return window.novaAPI.history.getRecent(limit);
});

const historySlice = createSlice({
  name: 'history',
  initialState: {
    items: [],
    recent: [],
    loading: false,
    panelOpen: false,
    searchQuery: ''
  },
  reducers: {
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHistory.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchRecentHistory.fulfilled, (state, action) => {
        state.recent = action.payload;
      })
      .addCase(clearHistory.fulfilled, (state) => {
        state.items = [];
        state.recent = [];
      });
  }
});

export const { togglePanel, setSearchQuery } = historySlice.actions;
export default historySlice.reducer;
