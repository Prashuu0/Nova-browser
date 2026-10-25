import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchSettings = createAsyncThunk('settings/fetchAll', async () => {
  const settings = await window.novaAPI.settings.getAll();
  if (settings.adBlockerEnabled !== undefined) {
    await window.novaAPI.privacy.setAdBlocker(settings.adBlockerEnabled);
  }
  if (settings.trackerBlockerEnabled !== undefined) {
    await window.novaAPI.privacy.setTrackerBlocker(settings.trackerBlockerEnabled);
  }
  return settings;
});

export const updateSetting = createAsyncThunk('settings/update', async ({ key, value }) => {
  await window.novaAPI.settings.set(key, value);
  if (key === 'adBlockerEnabled') await window.novaAPI.privacy.setAdBlocker(value);
  if (key === 'trackerBlockerEnabled') await window.novaAPI.privacy.setTrackerBlocker(value);
  if (key === 'fingerprintProtection') await window.novaAPI.privacy.setFingerprintProtection(value);
  return { key, value };
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    data: {
      theme: 'system',
      defaultSearchEngine: 'nova',
      homepage: 'nova://newtab',
      adBlockerEnabled: true,
      trackerBlockerEnabled: true,
      aiProvider: 'gemini'
    },
    panelOpen: false,
    loaded: false
  },
  reducers: {
    togglePanel: (state) => {
      state.panelOpen = !state.panelOpen;
    },
    setPanelOpen: (state, action) => {
      state.panelOpen = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.data = action.payload;
        state.loaded = true;
      })
      .addCase(updateSetting.fulfilled, (state, action) => {
        state.data[action.payload.key] = action.payload.value;
      });
  }
});

export const { togglePanel, setPanelOpen } = settingsSlice.actions;
export default settingsSlice.reducer;
