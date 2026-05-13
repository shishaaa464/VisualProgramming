const USERS_STORAGE_KEY = 'mock_users';

interface StoredUser {
    id: string;
    name: string;
    email: string;
    password: string;
    createdAt: number;
}

interface TokenPayload {
    userId: string;
    email: string;
    exp: number;
}

interface RefreshPayload {
    userId: string;
    exp: number;
}

const loadUsers = (): StoredUser[] => {
    const saved = localStorage.getItem(USERS_STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return [];
};

const saveUsers = (users: StoredUser[]): void => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

function generateToken(userId: string, email: string): string {
    const payload: TokenPayload = {
        userId,
        email,
        exp: Date.now() + 15 * 60 * 1000,
    };
    return btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })) + '.' +
        btoa(JSON.stringify(payload)) + '.' +
        btoa('fake_signature');
}

function generateRefreshToken(userId: string): string {
    const payload: RefreshPayload = {
        userId,
        exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    return btoa(JSON.stringify({ type: 'refresh', payload }));
}

export const authApi = {
    register: async (name: string, email: string, password: string) => {
        await delay(500);

        const currentUsers = loadUsers();

        const existing = currentUsers.find(u => u.email === email);
        if (existing) {
            throw new Error('Пользователь с таким email уже существует');
        }

        const newUser: StoredUser = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: Date.now(),
        };

        currentUsers.push(newUser);
        saveUsers(currentUsers);

        const accessToken = generateToken(newUser.id, email);
        const refreshToken = generateRefreshToken(newUser.id);

        return {
            user: { id: newUser.id, name: newUser.name, email: newUser.email, createdAt: newUser.createdAt },
            accessToken,
            refreshToken,
        };
    },

    login: async (email: string, password: string) => {
        await delay(500);

        const currentUsers = loadUsers();
        const user = currentUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            throw new Error('Неверный email или пароль');
        }

        const accessToken = generateToken(user.id, email);
        const refreshToken = generateRefreshToken(user.id);

        return {
            user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
            accessToken,
            refreshToken,
        };
    },

    refreshToken: async (refreshToken: string) => {
        await delay(300);
        try {
            const parts = refreshToken.split('.');
            if (parts.length !== 3) throw new Error('Invalid token');

            const decoded = JSON.parse(atob(parts[1]));
            const currentUsers = loadUsers();
            const user = currentUsers.find(u => u.id === decoded.payload.userId);
            if (!user) throw new Error('Invalid refresh token');

            const newAccessToken = generateToken(user.id, user.email);
            return { accessToken: newAccessToken };
        } catch {
            throw new Error('Refresh token expired');
        }
    },

    getCurrentUser: async (accessToken: string) => {
        await delay(100);
        try {
            const parts = accessToken.split('.');
            if (parts.length !== 3) throw new Error('Invalid token');

            const payload = JSON.parse(atob(parts[1]));
            const currentUsers = loadUsers();
            const user = currentUsers.find(u => u.id === payload.userId);
            if (!user) throw new Error('User not found');

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            };
        } catch {
            throw new Error('Invalid token');
        }
    },

    deleteAccount: async (userId: string, accessToken: string): Promise<void> => {
        await delay(500);

        try {
            const parts = accessToken.split('.');
            if (parts.length !== 3) throw new Error('Invalid token');
            const payload = JSON.parse(atob(parts[1]));
            if (payload.userId !== userId) {
                throw new Error('Unauthorized');
            }
        } catch {
            throw new Error('Unauthorized');
        }

        const currentUsers = loadUsers();
        const filteredUsers = currentUsers.filter(u => u.id !== userId);
        saveUsers(filteredUsers);

        const allDocs = JSON.parse(localStorage.getItem('mock_documents') || '[]');
        const filteredDocs = allDocs.filter((doc: { ownerId: string }) => doc.ownerId !== userId);
        localStorage.setItem('mock_documents', JSON.stringify(filteredDocs));

        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    },
};