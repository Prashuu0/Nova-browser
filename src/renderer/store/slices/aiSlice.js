import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const sendChatMessage = createAsyncThunk('ai/chat', async ({ messages, provider, model }) => {
  return window.novaAPI.ai.chat({ messages, provider, model });
});

export const summarizePage = createAsyncThunk('ai/summarize', async ({ content, provider }) => {
  return window.novaAPI.ai.summarize({ content, provider });
});

const aiSlice = createSlice({
  name: 'ai',
  initialState: {
    sidebarOpen: false,
    messages: [],
    conversations: [],
    loading: false,
    activeMode: 'chat'
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setActiveMode: (state, action) => {
      state.activeMode = action.payload;
    },
    loadConversation: (state, action) => {
      state.messages = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendChatMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: 'assistant',
          content: action.payload.content,
          timestamp: Date.now()
        });
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.loading = false;
        state.messages.push({
          role: 'assistant',
          content: action.error?.message || 'Nova AI request failed. Check Settings → AI.',
          timestamp: Date.now()
        });
      });
  }
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addMessage,
  clearMessages,
  setActiveMode,
  loadConversation
} = aiSlice.actions;

export default aiSlice.reducer;
