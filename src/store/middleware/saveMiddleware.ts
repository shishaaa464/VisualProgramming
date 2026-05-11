import type { Middleware } from '@reduxjs/toolkit';
import { updateCell, setData } from '../slices/spreadsheetSlice';
import { setSaveStatus } from '../slices/uiSlice';
import type { RootState } from '../index';

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export const saveMiddleware: Middleware = (store) => (next) => (action) => {
    const result = next(action);

    if (updateCell.match(action) || setData.match(action)) {
        store.dispatch(setSaveStatus('saving'));

        if (debounceTimer) clearTimeout(debounceTimer);

        debounceTimer = setTimeout(() => {
            const state = store.getState() as RootState;
            const data = state.spreadsheet.data;

            const saved = localStorage.getItem('spreadsheet_storage');
            if (saved) {
                const allDocs = JSON.parse(saved);
                const activeId = state.documents.activeDocId;

                if (activeId) {
                    const updated = allDocs.map((doc) => {
                        if (doc.id === activeId) {
                            return { ...doc, data: data, updatedAt: Date.now() };
                        }
                        return doc;
                    });
                    localStorage.setItem('spreadsheet_storage', JSON.stringify(updated));
                }
            }

            store.dispatch(setSaveStatus('saved'));
        }, 500);
    }

    return result;
};