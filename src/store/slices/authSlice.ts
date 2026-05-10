import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        user: { id: '1', name: 'Egor', role: 'admin' },
        isAuthenticated: true
    },
    reducers: {}
});

export default authSlice.reducer;