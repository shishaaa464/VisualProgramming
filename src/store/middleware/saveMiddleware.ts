import type { Middleware } from '@reduxjs/toolkit';
import { updateCell, setData } from '../slices/spreadsheetSlice';
import { setSaveStatus } from '../slices/uiSlice';
import type { SpreadsheetData } from '../../types/spreadsheet';

interface GuardedRootState {
    spreadsheet: {
        data: SpreadsheetData;
    };
    ui: {
        saveStatus: 'saved' | 'saving' | 'error';
    };
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const saveMiddleware: Middleware<{}, GuardedRootState> = (store) => (next) => (action) => {
    const result = next(action);

    if (updateCell.match(action) || setData.match(action)) {
        store.dispatch(setSaveStatus('saving'));

        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const state = store.getState() as GuardedRootState;
            const dataToSave = state.spreadsheet.data;

            console.log('Автосохранение данных:', dataToSave);

            store.dispatch(setSaveStatus('saved'));
        }, 500);
    }

    return result;
};