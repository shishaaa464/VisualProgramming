import type { SpreadsheetDoc, SpreadsheetData } from '../types/spreadsheet';

const DOCS_STORAGE_KEY = 'mock_documents';

const loadDocs = (): SpreadsheetDoc[] => {
    const saved = localStorage.getItem(DOCS_STORAGE_KEY);
    if (saved) {
        return JSON.parse(saved);
    }
    return [];
};

const saveDocs = (docs: SpreadsheetDoc[]): void => {
    localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docs));
};

let allDocs: SpreadsheetDoc[] = loadDocs();

export const documentsApi = {
    getUserDocuments: async (userId: string): Promise<SpreadsheetDoc[]> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        return allDocs.filter(doc => doc.ownerId === userId);
    },

    createDocument: async (doc: SpreadsheetDoc): Promise<SpreadsheetDoc> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        allDocs.push(doc);
        saveDocs(allDocs);
        return doc;
    },

    updateDocument: async (id: string, data: SpreadsheetData): Promise<SpreadsheetDoc> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = allDocs.findIndex(d => d.id === id);
        if (index !== -1) {
            allDocs[index] = { ...allDocs[index], data, updatedAt: Date.now() };
            saveDocs(allDocs);
            return allDocs[index];
        }
        throw new Error('Document not found');
    },

    deleteDocument: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        allDocs = allDocs.filter(d => d.id !== id);
        saveDocs(allDocs);
    },

    renameDocument: async (id: string, newTitle: string): Promise<SpreadsheetDoc> => {
        await new Promise(resolve => setTimeout(resolve, 300));
        const index = allDocs.findIndex(d => d.id === id);
        if (index !== -1) {
            allDocs[index] = { ...allDocs[index], title: newTitle, updatedAt: Date.now() };
            saveDocs(allDocs);
            return allDocs[index];
        }
        throw new Error('Document not found');
    },
};