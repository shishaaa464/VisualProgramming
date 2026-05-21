import { describe, it, expect } from 'vitest';
import reducer, { updateCell, undo, redo, setInitialData } from './spreadsheetSlice';

describe('spreadsheetSlice', () => {
    const initialState = {
        data: {},
        history: { past: [], future: [] },
    };

    it('должен устанавливать начальные данные', () => {
        const newData = { 'A1': { rawContent: 'test', value: 'test' } };
        const state = reducer(initialState, setInitialData(newData));
        expect(state.data).toEqual(newData);
        expect(state.history.past).toHaveLength(0);
    });

    it('должен обновлять ячейку и сохранять историю для Undo', () => {
        const payload = {
            id: 'B2',
            value: { rawContent: '10', value: '10' }
        };
        const state = reducer(initialState, updateCell(payload));

        expect(state.data['B2']).toEqual(payload.value);
        expect(state.history.past).toHaveLength(1);
        expect(state.history.past[0]).toEqual({});
    });

    it('должен корректно делать Undo и Redo', () => {
        const step1 = reducer(initialState, updateCell({
            id: 'A1',
            value: { rawContent: '1', value: '1' }
        }));

        const afterUndo = reducer(step1, undo());
        expect(afterUndo.data).toEqual({});
        expect(afterUndo.history.future).toHaveLength(1);

        const afterRedo = reducer(afterUndo, redo());
        expect(afterRedo.data['A1'].value).toBe('1');
    });
});