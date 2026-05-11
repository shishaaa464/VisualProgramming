import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDocuments, setActiveDocId } from '../store/slices/documentsSlice';
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
        const saved = localStorage.getItem('spreadsheet_storage');
        if (saved) {
            const allDocs = JSON.parse(saved);
            dispatch(setDocuments(allDocs));
        }
        setLoading(false);
    }, [dispatch]);

    useEffect(() => {
        if (documentId && documents.length > 0) {
            dispatch(setActiveDocId(documentId));
        }
    }, [documentId, documents, dispatch]);

    useEffect(() => {
        if (!loading && documents.length > 0 && documentId) {
            const exists = documents.some(d => d.id === documentId);
            if (!exists) {
                navigate('/404', { replace: true });
            }
        }
    }, [loading, documents, documentId, navigate]);

    const currentDoc = documents.find(d => d.id === documentId);

    if (loading) {
        return (
            <div className="spreadsheet-page-loading">
                Загрузка...
            </div>
        );
    }

    if (!currentDoc) {
        return (
            <div className="spreadsheet-page-not-found">
                Документ не найден
            </div>
        );
    }

    return (
        <div>
            <ConfirmNavigation />
            <Spreadsheet
                initialDoc={currentDoc}
                onAutoSave={() => { }}
            />
        </div>
    );
};

export default SpreadsheetPage;