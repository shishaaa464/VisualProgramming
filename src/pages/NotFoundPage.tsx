import { useNavigate } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-wrapper">
            <h1 className="not-found-code">404</h1>
            <h2 className="not-found-title">Документ не найден</h2>
            <p className="not-found-text">
                Такого документа не существует или он был удалён.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="not-found-btn"
            >
                Вернуться к документам
            </button>
        </div>
    );
};

export default NotFoundPage;