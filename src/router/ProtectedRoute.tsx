import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const isLoggedIn = true;

    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;