import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiManagementAPI } from '../../utils/api';

// Async thunks
export const fetchApis = createAsyncThunk(
  'api/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiManagementAPI.getApis();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch APIs'
      );
    }
  }
);

export const fetchApiById = createAsyncThunk(
  'api/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiManagementAPI.getApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch API details'
      );
    }
  }
);

export const createApi = createAsyncThunk(
  'api/create',
  async (apiData, { rejectWithValue }) => {
    try {
      const response = await apiManagementAPI.createApi(apiData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create API'
      );
    }
  }
);

export const updateApi = createAsyncThunk(
  'api/update',
  async ({ id, apiData }, { rejectWithValue }) => {
    try {
      const response = await apiManagementAPI.updateApi(id, apiData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update API'
      );
    }
  }
);

export const deleteApi = createAsyncThunk(
  'api/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiManagementAPI.deleteApi(id);
      return id;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete API'
      );
    }
  }
);

export const fetchApiHistory = createAsyncThunk(
  'api/fetchHistory',
  async ({ id, limit, page }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams();
      if (limit) queryParams.append('limit', limit);
      if (page) queryParams.append('page', page);
      
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';
      const response = await apiManagementAPI.getApiHistory(id, queryString);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch API history'
      );
    }
  }
);

export const checkApiStatus = createAsyncThunk(
  'api/checkStatus',
  async (id, { rejectWithValue }) => {
    try {
      const response = await apiManagementAPI.checkApi(id);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check API status'
      );
    }
  }
);

// Initial state
const initialState = {
  apis: [],
  currentApi: null,
  apiHistory: [],
  historyPagination: null,
  loading: false,
  historyLoading: false,
  error: null,
  success: false,
  message: ''
};

// Create slice
const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    resetApiState: (state) => {
      state.error = null;
      state.success = false;
      state.message = '';
    },
    clearCurrentApi: (state) => {
      state.currentApi = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all APIs
      .addCase(fetchApis.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApis.fulfilled, (state, action) => {
        state.loading = false;
        state.apis = action.payload;
      })
      .addCase(fetchApis.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch API by ID
      .addCase(fetchApiById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApiById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentApi = action.payload;
      })
      .addCase(fetchApiById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create API
      .addCase(createApi.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createApi.fulfilled, (state, action) => {
        state.loading = false;
        state.apis.push(action.payload);
        state.success = true;
        state.message = 'API created successfully';
      })
      .addCase(createApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update API
      .addCase(updateApi.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateApi.fulfilled, (state, action) => {
        state.loading = false;
        state.apis = state.apis.map(api => 
          api._id === action.payload._id ? action.payload : api
        );
        state.currentApi = action.payload;
        state.success = true;
        state.message = 'API updated successfully';
      })
      .addCase(updateApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Delete API
      .addCase(deleteApi.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteApi.fulfilled, (state, action) => {
        state.loading = false;
        state.apis = state.apis.filter(api => api._id !== action.payload);
        state.success = true;
        state.message = 'API deleted successfully';
      })
      .addCase(deleteApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Fetch API history
      .addCase(fetchApiHistory.pending, (state) => {
        state.historyLoading = true;
        state.error = null;
      })
      .addCase(fetchApiHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.apiHistory = action.payload.history || action.payload;
        state.historyPagination = action.payload.pagination;
      })
      .addCase(fetchApiHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.error = action.payload;
      })
      
      // Check API status
      .addCase(checkApiStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkApiStatus.fulfilled, (state, action) => {
        state.loading = false;
        // Update the API in the list
        if (action.payload.api) {
          state.apis = state.apis.map(api => 
            api._id === action.payload.api._id ? action.payload.api : api
          );
          // Update current API if it's the one being checked
          if (state.currentApi && state.currentApi._id === action.payload.api._id) {
            state.currentApi = action.payload.api;
            
            // Add the new status check to the history if it exists
            if (action.payload.status && state.apiHistory) {
              const newHistoryEntry = {
                _id: Date.now().toString(), // Temporary ID until we refresh
                api: action.payload.api._id,
                status: action.payload.status.status,
                responseTime: action.payload.status.responseTime,
                statusCode: action.payload.status.statusCode,
                timestamp: action.payload.status.timestamp || new Date().toISOString()
              };
              
              // Add to the beginning of the history array
              state.apiHistory = [newHistoryEntry, ...state.apiHistory];
            }
          }
        }
        state.success = true;
        state.message = 'API status checked successfully';
      })
      .addCase(checkApiStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { resetApiState, clearCurrentApi } = apiSlice.actions;
export default apiSlice.reducer; 