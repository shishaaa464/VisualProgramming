import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '../../api/authApi';
import type { RootState } from '../index';

interface User {
    id: string;
    name: string;
    email: string;
    createdAt: number;
}

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export const loadUser = createAsyncThunk(
    'auth/loadUser',
    async (_, { rejectWithValue }) => {
        const token = localStorage.getItem('accessToken');
        if (!token) return rejectWithValue('No token');

        try {
            const user = await authApi.getCurrentUser(token);
            return { user, accessToken: token };
        } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return rejectWithValue('Invalid token');
        }
    }
);

export const login = createAsyncThunk(
    'auth/login',
    async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
        try {
            const data = await authApi.login(email, password);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const register = createAsyncThunk(
    'auth/register',
    async ({ name, email, password }: { name: string; email: string; password: string }, { rejectWithValue }) => {
        try {
            const data = await authApi.register(name, email, password);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const logout = createAsyncThunk('auth/logout', async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return;
});

export const deleteAccount = createAsyncThunk(
    'auth/deleteAccount',
    async (_, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.auth.user;
        const token = state.auth.accessToken;

        if (!user || !token) {
            return rejectWithValue('No user or token');
        }

        try {
            await authApi.deleteAccount(user.id, token);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async ({ name }: { name: string }, { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.auth.user;

        if (!user) {
            return rejectWithValue('Not authenticated');
        }

        try {
            const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const userIndex = users.findIndex((u: any) => u.id === user.id);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            users[userIndex] = { ...users[userIndex], name };
            localStorage.setItem('mock_users', JSON.stringify(users));

            return { ...user, name };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string },
        { getState, rejectWithValue }) => {
        const state = getState() as RootState;
        const user = state.auth.user;

        if (!user) {
            return rejectWithValue('Not authenticated');
        }

        try {
            const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const userIndex = users.findIndex((u: any) => u.id === user.id);

            if (userIndex === -1) {
                throw new Error('User not found');
            }

            if (users[userIndex].password !== currentPassword) {
                throw new Error('Неверный текущий пароль');
            }

            users[userIndex] = { ...users[userIndex], password: newPassword };
            localStorage.setItem('mock_users', JSON.stringify(users));

            return;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState: AuthState = {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loadUser.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(loadUser.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(loadUser.rejected, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            })
            .addCase(login.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(login.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(register.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.user = action.payload.user;
                state.accessToken = action.payload.accessToken;
                state.isAuthenticated = true;
                state.isLoading = false;
            })
            .addCase(register.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
            })
            .addCase(deleteAccount.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteAccount.fulfilled, (state) => {
                state.user = null;
                state.accessToken = null;
                state.isAuthenticated = false;
                state.isLoading = false;
            })
            .addCase(deleteAccount.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.user = action.payload;
                state.isLoading = false;
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;