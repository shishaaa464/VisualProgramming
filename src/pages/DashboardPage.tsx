import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchUserDocuments, createDocumentThunk, deleteDocumentThunk, renameDocumentThunk } from '../store/slices/documentsSlice';
import Dashboard from '../features/spreadsheet/Dashboard';
import type { SpreadsheetDoc, SpreadsheetData } from '../types/spreadsheet';
import './DashboardPage.css';

const DashboardPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const documents = useAppSelector((state) => state.documents.list);
    const user = useAppSelector((state) => state.auth.user);

    useEffect(() => {
        if (user) {
            dispatch(fetchUserDocuments(user.id));
        }
    }, [dispatch, user]);

    const handleCreate = async (title: string, rows: number, cols: number, initialData: SpreadsheetData = {}) => {
        if (!user) return;

        const newDoc: SpreadsheetDoc = {
            id: Date.now().toString(),
            title: title || 'Новая таблица',
            rows: rows || 20,
            cols: cols || 10,
            data: initialData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerId: user.id,
        };

        await dispatch(createDocumentThunk(newDoc));
        navigate(`/documents/${newDoc.id}`);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Удалить документ?')) {
            dispatch(deleteDocumentThunk(id));
        }
    };

    const handleRename = (id: string, newTitle: string) => {
        if (newTitle.trim()) {
            dispatch(renameDocumentThunk({ id, title: newTitle }));
        }
    };

    const handleDuplicate = async (doc: SpreadsheetDoc) => {
        if (!user) return;

        const copy: SpreadsheetDoc = {
            ...doc,
            id: Date.now().toString(),
            title: doc.title + ' (копия)',
            data: JSON.parse(JSON.stringify(doc.data)),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerId: user.id,
        };

        await dispatch(createDocumentThunk(copy));
    };

    return (
        <div className="dashboard-page-wrapper">
            <Dashboard
                docs={documents}
                onCreate={handleCreate}
                onOpen={(doc) => navigate(`/documents/${doc.id}`)}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onRename={handleRename}
            />
        </div>
    );
};

export default DashboardPage;