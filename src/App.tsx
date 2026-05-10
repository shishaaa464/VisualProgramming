import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setDocuments, setActiveDocId } from './store/slices/documentsSlice';
import Spreadsheet from './features/spreadsheet/Spreadsheet';
import Dashboard from './features/spreadsheet/Dashboard';
import type { SpreadsheetDoc, SpreadsheetData } from './types/spreadsheet';

function App() {
    const dispatch = useAppDispatch();

    const documents = useAppSelector((state) => state.documents.list);
    const activeDocId = useAppSelector((state) => state.documents.activeDocId);

    useEffect(() => {
        const saved = localStorage.getItem('spreadsheet_storage');
        if (saved) {
            dispatch(setDocuments(JSON.parse(saved)));
        }
    }, [dispatch]);

    const saveAll = (newList: SpreadsheetDoc[]) => {
        dispatch(setDocuments(newList));
        localStorage.setItem('spreadsheet_storage', JSON.stringify(newList));
    };

    const handleCreate = (title: string, rows: number, cols: number, initialData: SpreadsheetData = {}) => {
        const newDoc: SpreadsheetDoc = {
            id: Date.now().toString(),
            title: title || "Новая таблица",
            rows: rows || 20,
            cols: cols || 10,
            data: initialData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            ownerId: 'current-user'
        };

        const newList = [newDoc, ...documents];
        saveAll(newList);
        dispatch(setActiveDocId(newDoc.id));
    };

    const currentDoc = documents.find(d => d.id === activeDocId);

    return (
        <div className="App">
            {currentDoc ? (
                <div className="editor-container">
                    <button onClick={() => dispatch(setActiveDocId(null))}>
                        Назад к списку
                    </button>
                    <Spreadsheet
                        initialDoc={currentDoc}
                        onAutoSave={(newData) => {
                            const newList = documents.map(doc =>
                                doc.id === currentDoc.id ? { ...doc, data: newData, updatedAt: Date.now() } : doc
                            );
                            saveAll(newList);
                        }}
                    />
                </div>
            ) : (
                <Dashboard
                    docs={documents}
                    onCreate={handleCreate}
                    onOpen={(doc) => dispatch(setActiveDocId(doc.id))}
                    onDelete={(id) => saveAll(documents.filter(d => d.id !== id))}
                    onDuplicate={() => { }}
                    onRename={() => { }}
                />
            )}
        </div>
    );
}

export default App;