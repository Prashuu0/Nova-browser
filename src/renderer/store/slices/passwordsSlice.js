import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchPasswords = createAsyncThunk('passwords/fetchAll', async () => {
  return window.novaAPI.passwords.getAll();
});

export const savePassword = createAsyncThunk('passwords/save', async (data) => {
  return window.novaAPI.passwords.save(data);
});

export const removePassword = createAsyncThunk('passwords/remove', async (id) => {
  await window.novaAPI.passwords.remove(id);
  return id;
});

const passwordsSlice = createSlice({
  name: 'passwords',
  initialState: {
    items: [],
    panelOpen: false,
    loading: false
  },
  reducers: {
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPasswords.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(savePassword.fulfilled, (state, action) => {
        const existing = state.items.findIndex(
          (p) => p.origin === action.payload.origin && p.username === action.payload.username
        );
        if (existing >= 0) {
          state.items[existing] = action.payload;
        } else {
          state.items.unshift(action.payload);
        }
      })
      .addCase(removePassword.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  }
});

export const { togglePanel } = passwordsSlice.actions;
export default passwordsSlice.reducer;
