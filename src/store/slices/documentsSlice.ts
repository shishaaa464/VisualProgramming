import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SpreadsheetDoc } from '../../types/spreadsheet';

export const fetchDocuments = createAsyncThunk(
    'documents/fetchDocuments',
    async () => {
        await new Promise(resolve => setTimeout(resolve, 500));
        return [] as SpreadsheetDoc[];
    }
);

interface DocumentsState {
    list: SpreadsheetDoc[];
    activeDocId: string | null;
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: DocumentsState = {
    list: [],
    activeDocId: null,
    status: 'idle',
};

const documentsSlice = createSlice({
    name: 'documents',
    initialState,
    reducers: {
        setDocuments: (state, action: PayloadAction<SpreadsheetDoc[]>) => {
            state.list = action.payload;
        },
        setActiveDocId: (state, action: PayloadAction<string | null>) => {
            state.activeDocId = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchDocuments.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchDocuments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload;
            })
            .addCase(fetchDocuments.rejected, (state) => {
                state.status = 'failed';
            });
    },
});

export const { setDocuments, setActiveDocId } = documentsSlice.actions;
export default documentsSlice.reducer;