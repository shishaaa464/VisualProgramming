import { useLocation, useParams } from 'react-router-dom';
import { useAppSelector } from '../store/hooks';

const Breadcrumbs = () => {
    const location = useLocation();
    const { documentId } = useParams();
    const docs = useAppSelector((state) => state.documents.list);

    let docTitle = '';
    if (documentId) {
        const doc = docs.find(d => d.id === documentId);
        if (doc) docTitle = doc.title;
    }

    let pathText = 'Мои документы';

    if (location.pathname.startsWith('/documents/')) {
        pathText = 'Мои документы › ' + (docTitle || 'Загрузка...');
    } else if (location.pathname === '/profile') {
        pathText = 'Мои документы › Профиль';
    }

    return (
        <span style={{ color: '#5f6368', fontSize: '14px', marginLeft: '20px' }}>
            {pathText}
        </span>
    );
};

export default Breadcrumbs;