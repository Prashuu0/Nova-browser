import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchDownloads = createAsyncThunk('downloads/fetchAll', async () => {
  return window.novaAPI.downloads.getAll();
});

const downloadsSlice = createSlice({
  name: 'downloads',
  initialState: {
    items: [],
    panelOpen: false,
    activeCount: 0
  },
  reducers: {
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    updateProgress: (state, action) => {
      const item = state.items.find((d) => d.id === action.payload.id);
      if (item) {
        item.received_bytes = action.payload.receivedBytes;
        item.size = action.payload.totalBytes;
        item.state = action.payload.state;
      }
    },
    downloadComplete: (state, action) => {
      const item = state.items.find((d) => d.id === action.payload.id);
      if (item) {
        item.state = action.payload.state;
        item.path = action.payload.path;
      }
      state.activeCount = state.items.filter((d) => d.state === 'progressing').length;
    },
    addDownload: (state, action) => {
      state.items.unshift(action.payload);
      state.activeCount += 1;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchDownloads.fulfilled, (state, action) => {
      state.items = action.payload;
      state.activeCount = action.payload.filter((d) => d.state === 'progressing').length;
    });
  }
});

export const { togglePanel, updateProgress, downloadComplete, addDownload } = downloadsSlice.actions;
export default downloadsSlice.reducer;
