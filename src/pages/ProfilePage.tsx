import { useAppSelector } from '../store/hooks';
import './ProfilePage.css';

const ProfilePage = () => {
    const user = useAppSelector((state) => state.auth.user);
    const documents = useAppSelector((state) => state.documents.list);

    const firstLetter = user ? user.name.charAt(0).toUpperCase() : '?';

    return (
        <div className="profile-page-wrapper">
            <div className="profile-card">
                <div className="profile-avatar">
                    {firstLetter}
                </div>

                <h2 className="profile-name">
                    {user ? user.name : 'Пользователь'}
                </h2>
                <p className="profile-email">
                    egor@gmail.com
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
                            {new Date().toLocaleDateString()}
                        </div>
                        <div className="profile-stat-label">
                            Дата регистрации
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;