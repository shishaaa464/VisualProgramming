import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setActiveDocId } from '../store/slices/documentsSlice';
import { setInitialData } from '../store/slices/spreadsheetSlice';
import Spreadsheet from '../features/spreadsheet/Spreadsheet';
import ConfirmNavigation from '../components/ConfirmNavigation';
import './SpreadsheetPage.css';

const SpreadsheetPage = () => {
    const { documentId } = useParams();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const documents = useAppSelector((state) => state.documents.list);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (documentId && documents.length > 0) {
            const doc = documents.find(d => d.id === documentId);
            if (doc) {
                dispatch(setInitialData(doc.data));
                dispatch(setActiveDocId(documentId));
                setLoading(false);
            } else {
                navigate('/404', { replace: true });
            }
        } else if (documents.length > 0 && !documentId) {
            navigate('/dashboard');
        } else if (documents.length === 0 && !loading) {
            navigate('/dashboard');
        } else {
            setLoading(false);
        }
    }, [documentId, documents, dispatch, navigate]);

    const currentDoc = documents.find(d => d.id === documentId);

    if (loading) {
        return <div className="spreadsheet-page-loading">Загрузка...</div>;
    }

    if (!currentDoc) {
        return <div className="spreadsheet-page-not-found">Документ не найден</div>;
    }

    return (
        <div>
            <ConfirmNavigation />
            <Spreadsheet
                initialDoc={currentDoc}
            />
        </div>
    );
};

export default SpreadsheetPage;