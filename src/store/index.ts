import { configureStore } from '@reduxjs/toolkit';
import spreadsheetReducer from './slices/spreadsheetSlice';
import uiReducer from './slices/uiSlice';
import documentsReducer from './slices/documentsSlice';
import { saveMiddleware } from './middleware/saveMiddleware';

export const store = configureStore({
    reducer: {
        spreadsheet: spreadsheetReducer,
        ui: uiReducer,
        documents: documentsReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(saveMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;