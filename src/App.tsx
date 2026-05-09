import { useState, useEffect } from 'react';
import Spreadsheet from './features/spreadsheet/Spreadsheet';
import Dashboard from './features/spreadsheet/Dashboard';
import type { SpreadsheetDoc, SpreadsheetData } from './types/spreadsheet';

const api = {
    delay: () => new Promise(resolve => setTimeout(resolve, 300)),

    getDocuments: async (userId: string): Promise<SpreadsheetDoc[]> => {
        await api.delay();
        const saved = localStorage.getItem(`spreadsheet_docs_${userId}`);
        return saved ? JSON.parse(saved) : [];
    },

    saveDocument: async (userId: string, docId: string, data: SpreadsheetData): Promise<void> => {
        await api.delay();
        const docs = await api.getDocuments(userId);
        const updatedDocs = docs.map(doc =>
            doc.id === docId ? { ...doc, data, updatedAt: Date.now() } : doc
        );
        localStorage.setItem(`spreadsheet_docs_${userId}`, JSON.stringify(updatedDocs));
    },

    createDocument: async (userId: string, doc: SpreadsheetDoc): Promise<SpreadsheetDoc> => {
        await api.delay();
        const docs = await api.getDocuments(userId);
        const newDocs = [doc, ...docs];
        localStorage.setItem(`spreadsheet_docs_${userId}`, JSON.stringify(newDocs));
        return doc;
    },

    deleteDocument: async (userId: string, docId: string): Promise<void> => {
        await api.delay();
        const docs = await api.getDocuments(userId);
        const filtered = docs.filter(doc => doc.id !== docId);
        localStorage.setItem(`spreadsheet_docs_${userId}`, JSON.stringify(filtered));
    },

    renameDocument: async (userId: string, docId: string, newTitle: string): Promise<void> => {
        await api.delay();
        const docs = await api.getDocuments(userId);
        const updatedDocs = docs.map(doc =>
            doc.id === docId ? { ...doc, title: newTitle, updatedAt: Date.now() } : doc
        );
        localStorage.setItem(`spreadsheet_docs_${userId}`, JSON.stringify(updatedDocs));
    },

    duplicateDocument: async (userId: string, doc: SpreadsheetDoc): Promise<SpreadsheetDoc> => {
        await api.delay();
        const newDoc: SpreadsheetDoc = {
            ...doc,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            title: doc.title + ' (копия)',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        const docs = await api.getDocuments(userId);
        const newDocs = [newDoc, ...docs];
        localStorage.setItem(`spreadsheet_docs_${userId}`, JSON.stringify(newDocs));
        return newDoc;
    }
};

function App() {
    const [currentUser] = useState({ id: '69', name: 'Test', email: 'test@example.com' });
    const [documents, setDocuments] = useState<SpreadsheetDoc[]>([]);
    const [activeDocId, setActiveDocId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            setIsLoading(true);
            const docs = await api.getDocuments(currentUser.id);
            setDocuments(docs);
        } catch (err) {
            setError('Ошибка загрузки документов');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (title: string, rows: number, cols: number, initialData: SpreadsheetData = {}) => {
        try {
            const newDoc: SpreadsheetDoc = {
                id: Date.now().toString(),
                title: title || "Новая таблица",
                rows: rows || 20,
                cols: cols || 10,
                data: initialData,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ownerId: currentUser.id
            };

            await api.createDocument(currentUser.id, newDoc);
            setDocuments(prev => [newDoc, ...prev]);
            setActiveDocId(newDoc.id);
        } catch (err) {
            setError('Ошибка создания документа');
            console.error(err);
        }
    };

    const handleUpdateData = async (id: string, newData: SpreadsheetData) => {
        try {
            await api.saveDocument(currentUser.id, id, newData);
            setDocuments(prev => prev.map(doc =>
                doc.id === id ? { ...doc, data: newData, updatedAt: Date.now() } : doc
            ));
        } catch (err) {
            setError('Ошибка сохранения документа');
            console.error(err);
        }
    };

    const handleRename = async (id: string, newTitle: string) => {
        try {
            await api.renameDocument(currentUser.id, id, newTitle);
            setDocuments(prev => prev.map(doc =>
                doc.id === id ? { ...doc, title: newTitle, updatedAt: Date.now() } : doc
            ));
        } catch (err) {
            setError('Ошибка переименования документа');
            console.error(err);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await api.deleteDocument(currentUser.id, id);
            setDocuments(prev => prev.filter(d => d.id !== id));
            if (activeDocId === id) setActiveDocId(null);
        } catch (err) {
            setError('Ошибка удаления документа');
            console.error(err);
        }
    };

    const handleDuplicate = async (doc: SpreadsheetDoc) => {
        try {
            const newDoc = await api.duplicateDocument(currentUser.id, doc);
            setDocuments(prev => [newDoc, ...prev]);
        } catch (err) {
            setError('Ошибка дублирования документа');
            console.error(err);
        }
    };

    const currentDoc = documents.find(d => d.id === activeDocId);

    if (isLoading) {
        return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <p style={{ color: 'red' }}>{error}</p>
                <button onClick={() => { setError(null); loadDocuments(); }}>Повторить</button>
            </div>
        );
    }

    return (
        <div className="App">
            {currentDoc ? (
                <div className="editor-container">
                    <button
                        style={{
                            margin: '10px',
                            padding: '5px 15px',
                            cursor: 'pointer',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}
                        onClick={() => setActiveDocId(null)}
                    >
                        Назад к документам
                    </button>
                    <Spreadsheet
                        initialDoc={currentDoc}
                        onAutoSave={(newData) => handleUpdateData(currentDoc.id, newData)}
                    />
                </div>
            ) : (
                <Dashboard
                    docs={documents}
                    onCreate={handleCreate}
                    onOpen={(doc) => setActiveDocId(doc.id)}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                    onRename={handleRename}
                />
            )}
        </div>
    );
}

export default App;