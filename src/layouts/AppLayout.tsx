import { Outlet, useNavigate } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';
import Breadcrumbs from '../components/Breadcrumbs';
import './AppLayout.css';

const AppLayout = () => {
    const navigate = useNavigate();
    const user = useAppSelector((state) => state.auth.user);

    const goToDashboard = () => {
        navigate('/dashboard');
    };

    const goToProfile = () => {
        navigate('/profile');
    };

    return (
        <div className="app-layout-container">
            <div className="app-header">
                <div className="app-header-left">
                    <h2 className="app-logo" onClick={goToDashboard}>
                        Таблицы
                    </h2>
                    <Breadcrumbs />
                </div>

                <div className="app-header-right">
                    <button className="app-header-btn" onClick={goToDashboard}>
                        Документы
                    </button>
                    <button className="app-header-btn" onClick={goToProfile}>
                        {user ? user.name : 'Профиль'}
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