import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchBookmarks = createAsyncThunk('bookmarks/fetchAll', async () => {
  return window.novaAPI.bookmarks.getAll();
});

export const addBookmark = createAsyncThunk('bookmarks/add', async (bookmark) => {
  return window.novaAPI.bookmarks.add(bookmark);
});

export const removeBookmark = createAsyncThunk('bookmarks/remove', async (id) => {
  await window.novaAPI.bookmarks.remove(id);
  return id;
});

const bookmarksSlice = createSlice({
  name: 'bookmarks',
  initialState: {
    items: [],
    loading: false,
    sidebarOpen: false
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookmarks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBookmarks.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(addBookmark.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(removeBookmark.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b.id !== action.payload);
      });
  }
});

export const { toggleSidebar, setSidebarOpen } = bookmarksSlice.actions;
export default bookmarksSlice.reducer;
