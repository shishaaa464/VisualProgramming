import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setDocuments } from '../store/slices/documentsSlice';
import Dashboard from '../features/spreadsheet/Dashboard';
import type { SpreadsheetDoc, SpreadsheetData } from '../types/spreadsheet';
import './DashboardPage.css';

const DashboardPage = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const documents = useAppSelector((state) => state.documents.list);

    useEffect(() => {
        const saved = localStorage.getItem('spreadsheet_storage');
        if (saved) {
            dispatch(setDocuments(JSON.parse(saved)));
        }
    }, [dispatch]);

    const saveAll = (list: SpreadsheetDoc[]) => {
        dispatch(setDocuments(list));
        localStorage.setItem('spreadsheet_storage', JSON.stringify(list));
    };

    const handleCreate = (title: string, rows: number, cols: number, initialData: SpreadsheetData = {}) => {
        const newDoc: SpreadsheetDoc = {
            id: Date.now().toString(),
            title: title || 'Новая таблица',
            rows: rows || 20,
            cols: cols || 10,
            data: initialData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerId: 'current-user'
        };

        const newList = [newDoc, ...documents];
        saveAll(newList);
        navigate(`/documents/${newDoc.id}`);
    };

    const handleOpen = (doc: SpreadsheetDoc) => {
        navigate(`/documents/${doc.id}`);
    };

    const handleDelete = (id: string) => {
        saveAll(documents.filter(d => d.id !== id));
    };

    const handleDuplicate = (doc: SpreadsheetDoc) => {
        const copy: SpreadsheetDoc = {
            ...doc,
            id: Date.now().toString(),
            title: doc.title + ' (копия)',
            data: { ...doc.data },
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        saveAll([copy, ...documents]);
    };

    const handleRename = (id: string, newTitle: string) => {
        const updated = documents.map(d => {
            if (d.id === id) {
                return { ...d, title: newTitle, updatedAt: Date.now() };
            }
            return d;
        });
        saveAll(updated);
    };

    return (
        <div className="dashboard-page-wrapper">
            <Dashboard
                docs={documents}
                onCreate={handleCreate}
                onOpen={handleOpen}
                onDelete={handleDelete}
                onDuplicate={handleDuplicate}
                onRename={handleRename}
            />
        </div>
    );
};

export default DashboardPage;