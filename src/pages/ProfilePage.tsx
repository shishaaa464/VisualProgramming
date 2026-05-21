import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { updateProfile, changePassword } from '../store/slices/authSlice';
import './ProfilePage.css';

const ProfilePage = () => {
    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const documents = useAppSelector((state) => state.documents.list);
    const { isLoading } = useAppSelector((state) => state.auth);

    const [isEditingName, setIsEditingName] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [nameError, setNameError] = useState('');
    const [nameSuccess, setNameSuccess] = useState('');

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const firstLetter = user && user.name ? user.name.charAt(0).toUpperCase() : '?';

    const handleSaveName = async () => {
        if (!newName.trim()) {
            setNameError('Имя не может быть пустым');
            return;
        }

        setNameError('');
        try {
            await dispatch(updateProfile({ name: newName })).unwrap();
            setNameSuccess('Имя успешно обновлено');
            setIsEditingName(false);
            setTimeout(() => setNameSuccess(''), 3000);
        } catch (err: any) {
            setNameError(err.message || 'Ошибка при обновлении имени');
        }
    };

    const handleChangePassword = async () => {
        if (newPassword.length < 8) {
            setPasswordError('Пароль должен быть не менее 8 символов');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('Пароли не совпадают');
            return;
        }
        if (!currentPassword) {
            setPasswordError('Введите текущий пароль');
            return;
        }

        setPasswordError('');
        try {
            await dispatch(changePassword({
                currentPassword,
                newPassword
            })).unwrap();
            setPasswordSuccess('Пароль успешно изменен');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setIsChangingPassword(false);
            setTimeout(() => setPasswordSuccess(''), 3000);
        } catch (err: any) {
            setPasswordError(err.message || 'Ошибка при смене пароля');
        }
    };

    const handleDeleteAccount = () => {
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setIsDeleting(true);

        try {
            if (!user) throw new Error('Нет данных пользователя');

            const users = JSON.parse(localStorage.getItem('mock_users') || '[]');
            const filteredUsers = users.filter((u: any) => u.id !== user.id);
            localStorage.setItem('mock_users', JSON.stringify(filteredUsers));

            const docs = JSON.parse(localStorage.getItem('mock_documents') || '[]');
            const filteredDocs = docs.filter((d: any) => d.ownerId !== user.id);
            localStorage.setItem('mock_documents', JSON.stringify(filteredDocs));

            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');

            alert('Аккаунт успешно удалён');
            window.location.href = '/login';
        } catch (error) {
            alert('Ошибка при удалении аккаунта');
            console.error(error);
            setIsDeleting(false);
        }
    };

    const cancelDelete = () => {
        setShowConfirm(false);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="profile-page-wrapper">
            <div className="profile-card">
                <div className="profile-avatar">
                    {firstLetter}
                </div>

                {isEditingName ? (
                    <div className="profile-edit-name">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="profile-input"
                            autoFocus
                        />
                        {nameError && <div className="profile-error">{nameError}</div>}
                        {nameSuccess && <div className="profile-success">{nameSuccess}</div>}
                        <div className="profile-edit-actions">
                            <button onClick={handleSaveName} disabled={isLoading}>
                                Сохранить
                            </button>
                            <button onClick={() => {
                                setIsEditingName(false);
                                setNewName(user?.name || '');
                                setNameError('');
                            }}>
                                Отмена
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="profile-name-wrapper">
                        <h2 className="profile-name">{user?.name || 'Пользователь'}</h2>
                        <button
                            className="profile-edit-btn"
                            onClick={() => setIsEditingName(true)}
                            title="Редактировать имя"
                        >
                            ✏️
                        </button>
                    </div>
                )}

                <p className="profile-email">
                    📧 {user?.email || 'email@example.com'}
                </p>

                <div className="profile-stats">
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Документов:</span>
                        <span className="profile-stat-value">{documents.length}</span>
                    </div>
                    <div className="profile-stat-item">
                        <span className="profile-stat-label">Дата регистрации:</span>
                        <span className="profile-stat-value">
                            {user?.createdAt ? formatDate(user.createdAt) : '—'}
                        </span>
                    </div>
                </div>

                <div className="profile-password-section">
                    <button
                        className="profile-toggle-password"
                        onClick={() => setIsChangingPassword(!isChangingPassword)}
                    >
                        {isChangingPassword ? '− Скрыть форму' : '+ Сменить пароль'}
                    </button>

                    {isChangingPassword && (
                        <div className="profile-password-form">
                            <input
                                type="password"
                                placeholder="Текущий пароль"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="profile-input"
                            />
                            <input
                                type="password"
                                placeholder="Новый пароль (мин. 8 символов)"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="profile-input"
                            />
                            <input
                                type="password"
                                placeholder="Подтвердите новый пароль"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="profile-input"
                            />
                            {passwordError && <div className="profile-error">{passwordError}</div>}
                            {passwordSuccess && <div className="profile-success">{passwordSuccess}</div>}
                            <div className="profile-password-actions">
                                <button onClick={handleChangePassword} disabled={isLoading}>
                                    Сохранить пароль
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button
                    className="delete-account-btn"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Удаление...' : '🗑 Удалить мой аккаунт'}
                </button>

                {showConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Вы уверены, что хотите удалить аккаунт?</h3>
                            <p>Это действие необратимо. Все ваши документы будут удалены.</p>
                            <div className="modal-buttons">
                                <button className="confirm-btn" onClick={confirmDelete}>
                                    Да, удалить
                                </button>
                                <button className="cancel-btn" onClick={cancelDelete}>
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;