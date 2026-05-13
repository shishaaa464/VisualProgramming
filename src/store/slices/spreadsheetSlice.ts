import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SpreadsheetData, CellData } from '../../types/spreadsheet';

interface SpreadsheetState {
    data: SpreadsheetData;
    history: {
        past: SpreadsheetData[];
        future: SpreadsheetData[];
    };
}

const initialState: SpreadsheetState = {
    data: {},
    history: {
        past: [],
        future: [],
    },
};

const spreadsheetSlice = createSlice({
    name: 'spreadsheet',
    initialState,
    reducers: {
        setInitialData: (state, action: PayloadAction<SpreadsheetData>) => {
            state.data = action.payload;
            state.history.past = [];
            state.history.future = [];
        },

        updateCell: (state, action: PayloadAction<{ id: string; value: CellData }>) => {
            state.history.past.push({ ...state.data });

            if (state.history.past.length > 20) state.history.past.shift();

            state.history.future = [];

            const { id, value } = action.payload;
            state.data[id] = value;
        },

        setData: (state, action: PayloadAction<SpreadsheetData>) => {
            state.history.past.push({ ...state.data });
            state.data = action.payload;
            state.history.future = [];
        },

        undo: (state) => {
            const previous = state.history.past.pop();
            if (previous) {
                state.history.future.push({ ...state.data });
                state.data = previous;
            }
        },

        redo: (state) => {
            const next = state.history.future.pop();
            if (next) {
                state.history.past.push({ ...state.data });
                state.data = next;
            }
        },
    },
});

export const { setInitialData, updateCell, setData, undo, redo } = spreadsheetSlice.actions;
export default spreadsheetSlice.reducer;