import { Outlet, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Breadcrumbs from '../components/Breadcrumbs';
import './AppLayout.css';

const AppLayout = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);
    const saveStatus = useAppSelector((state) => state.ui.saveStatus);

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    const goToProfile = () => {
        navigate('/profile');
    };

    const handleLogout = () => {
        console.log('Кнопка выхода нажата');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
    };

    const getSaveStatusText = () => {
        if (saveStatus === 'saving') return 'Сохранение...';
        if (saveStatus === 'error') return 'Ошибка';
        return '';
    };

    return (
        <div className="app-layout-container">
            <div className="app-header">
                <div className="app-header-left">
                    <h2 className="app-logo" onClick={goToDashboard}>
                        Таблицы
                    </h2>
                    <Breadcrumbs />
                    {getSaveStatusText() && (
                        <span className={`save-status-indicator ${saveStatus}`}>
                            {getSaveStatusText()}
                        </span>
                    )}
                </div>

                <div className="app-header-right">
                    <button className="app-header-btn" onClick={goToDashboard}>
                        Документы
                    </button>
                    <button className="app-header-btn" onClick={goToProfile}>
                        {user ? user.name : 'Профиль'}
                    </button>
                    <button
                        className="app-header-btn logout-btn"
                        onClick={handleLogout}
                        style={{ background: '#d93025', color: 'white' }}
                    >
                        Выйти
                    </button>
                </div>
            </div>

            <div className="app-main-content">
                <Outlet />
            </div>
        </div>
    );
};

export default AppLayout;