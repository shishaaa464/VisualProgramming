import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UIState {
    saveStatus: 'saved' | 'saving' | 'error';
    activeModal: string | null;
}

const initialState: UIState = {
    saveStatus: 'saved',
    activeModal: null,
};

const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        setSaveStatus: (state, action: PayloadAction<UIState['saveStatus']>) => {
            state.saveStatus = action.payload;
        },
        openModal: (state, action: PayloadAction<string>) => {
            state.activeModal = action.payload;
        },
        closeModal: (state) => {
            state.activeModal = null;
        },
    },
});

export const { setSaveStatus, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;