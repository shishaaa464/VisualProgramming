import { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import './ProfilePage.css';

const ProfilePage = () => {
    const user = useAppSelector((state) => state.auth.user);
    const documents = useAppSelector((state) => state.documents.list);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const firstLetter = user && user.name ? user.name.charAt(0).toUpperCase() : '?';

    const handleDeleteAccount = () => {
        setShowConfirm(true);
    };

    const confirmDelete = () => {
        setShowConfirm(false);
        setIsDeleting(true);

        try {
            if (!user) {
                throw new Error('Нет данных пользователя');
            }

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

    return (
        <div className="profile-page-wrapper">
            <div className="profile-card">
                <div className="profile-avatar">
                    {firstLetter}
                </div>

                <h2 className="profile-name">
                    {user && user.name ? user.name : 'Пользователь'}
                </h2>
                <p className="profile-email">
                    {user && user.email ? user.email : 'email@example.com'}
                </p>

                <div className="profile-stats">
                    <div>
                        <div className="profile-stat-value">
                            {documents.length}
                        </div>
                        <div className="profile-stat-label">
                            Документов
                        </div>
                    </div>
                    <div>
                        <div className="profile-stat-value">
                            {user && user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : '—'}
                        </div>
                        <div className="profile-stat-label">
                            Дата регистрации
                        </div>
                    </div>
                </div>

                <button
                    className="delete-account-btn"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                >
                    {isDeleting ? 'Удаление...' : 'Удалить мой аккаунт'}
                </button>

                {showConfirm && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Вы уверены, что хотите удалить аккаунт?</h3>
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