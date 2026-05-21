import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SpreadsheetData, CellData, CellStyle } from '../../types/spreadsheet';

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

const getColLabel = (index: number): string => {
    let label = '';
    let n = index;
    while (n >= 0) {
        label = String.fromCharCode((n % 26) + 65) + label;
        n = Math.floor(n / 26) - 1;
    }
    return label;
};

const getColIndex = (col: string): number => {
    let idx = 0;
    for (let i = 0; i < col.length; i++) {
        idx = idx * 26 + (col.charCodeAt(i) - 64);
    }
    return idx - 1;
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

        applyStyleToSelection: (state, action: PayloadAction<{
            selection: { startCol: string; startRow: number; endCol: string; endRow: number };
            style: Partial<CellStyle>;
        }>) => {
            const { selection, style } = action.payload;

            state.history.past.push({ ...state.data });
            if (state.history.past.length > 20) state.history.past.shift();
            state.history.future = [];

            const startColIdx = getColIndex(selection.startCol);
            const endColIdx = getColIndex(selection.endCol);
            const startRow = selection.startRow;
            const endRow = selection.endRow;

            for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
                const col = getColLabel(colIdx);
                for (let row = startRow; row <= endRow; row++) {
                    const cellId = `${col}${row}`;
                    if (state.data[cellId]) {
                        state.data[cellId].style = {
                            ...state.data[cellId].style,
                            ...style
                        };
                    } else {
                        state.data[cellId] = {
                            rawContent: '',
                            value: '',
                            style: { ...style }
                        };
                    }
                }
            }
        },
    },
});

export const { setInitialData, updateCell, setData, undo, redo, applyStyleToSelection } = spreadsheetSlice.actions;
export default spreadsheetSlice.reducer;