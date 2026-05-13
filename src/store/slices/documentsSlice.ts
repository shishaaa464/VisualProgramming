import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SpreadsheetDoc, SpreadsheetData } from '../../types/spreadsheet';
import { documentsApi } from '../../api/documentsApi';

export const fetchUserDocuments = createAsyncThunk(
    'documents/fetchUserDocuments',
    async (userId: string) => {
        return await documentsApi.getUserDocuments(userId);
    }
);

export const createDocumentThunk = createAsyncThunk(
    'documents/createDocument',
    async (doc: SpreadsheetDoc) => {
        return await documentsApi.createDocument(doc);
    }
);

export const updateDocumentThunk = createAsyncThunk(
    'documents/updateDocument',
    async ({ id, data }: { id: string; data: SpreadsheetData }) => {
        return await documentsApi.updateDocument(id, data);
    }
);

export const deleteDocumentThunk = createAsyncThunk(
    'documents/deleteDocument',
    async (id: string) => {
        await documentsApi.deleteDocument(id);
        return id;
    }
);

export const renameDocumentThunk = createAsyncThunk(
    'documents/renameDocument',
    async ({ id, title }: { id: string; title: string }) => {
        return await documentsApi.renameDocument(id, title);
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
        setActiveDocId: (state, action: PayloadAction<string | null>) => {
            state.activeDocId = action.payload;
        },
        clearDocuments: (state) => {
            state.list = [];
            state.activeDocId = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserDocuments.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserDocuments.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.list = action.payload;
            })
            .addCase(fetchUserDocuments.rejected, (state) => {
                state.status = 'failed';
            })
            .addCase(createDocumentThunk.fulfilled, (state, action) => {
                state.list.unshift(action.payload);
            })
            .addCase(deleteDocumentThunk.fulfilled, (state, action) => {
                state.list = state.list.filter(d => d.id !== action.payload);
                if (state.activeDocId === action.payload) {
                    state.activeDocId = null;
                }
            })
            .addCase(renameDocumentThunk.fulfilled, (state, action) => {
                const index = state.list.findIndex(d => d.id === action.payload.id);
                if (index !== -1) {
                    state.list[index] = action.payload;
                }
            });
    },
});

export const { setActiveDocId, clearDocuments } = documentsSlice.actions;
export default documentsSlice.reducer;