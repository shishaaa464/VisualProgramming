import React, { useState } from 'react';
import type { SpreadsheetData, SpreadsheetDoc } from '../../types/spreadsheet';
import './Dashboard.css';

interface DashboardProps {
    docs: SpreadsheetDoc[];
    onCreate: (title: string, r: number, c: number, data?: SpreadsheetData) => void;
    onOpen: (doc: SpreadsheetDoc) => void;
    onDelete: (id: string) => void;
    onDuplicate: (doc: SpreadsheetDoc) => void;
    onRename: (id: string, title: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ docs, onCreate, onOpen, onDelete, onDuplicate, onRename }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [name, setName] = useState('Новая таблица');
    const [dims, setDims] = useState({ r: 20, c: 10 });

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');

            let startRow = 0;
            if (lines[0]?.startsWith('sep=')) startRow = 1;

            const csvRows = lines.slice(startRow);
            const importedData: SpreadsheetData = {};
            let maxColIdx = 0;
            let maxRowIdx = csvRows.length;

            csvRows.forEach((line, rIdx) => {
                const cells = line.split(';');
                const rowNum = rIdx + 1;
                if (cells.length > maxColIdx) maxColIdx = cells.length;

                cells.forEach((val, cIdx) => {
                    const cleanVal = val.replace(/^"|"$/g, '').trim();
                    if (cleanVal) {
                        const colLabel = String.fromCharCode(65 + cIdx);
                        importedData[`${colLabel}${rowNum}`] = {
                            value: cleanVal,
                            rawContent: cleanVal
                        };
                    }
                });
            });

            onCreate(
                file.name.replace('.csv', ''),
                Math.max(20, maxRowIdx),
                Math.max(10, maxColIdx),
                importedData
            );

            e.target.value = '';
        };
        reader.readAsText(file);
    };

    const renderPreview = (doc: SpreadsheetDoc) => {
        const rows = [1, 2, 3];
        const cols = ['A', 'B', 'C'];
        return (
            <table className="mini-table">
                <tbody>
                    {rows.map(r => (
                        <tr key={r}>
                            {cols.map(c => {
                                const cellId = `${c}${r}`;
                                const cellValue = doc.data[cellId]?.value || '';
                                return <td key={c}>{String(cellValue)}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="dashboard-layout">
            <div className="dashboard-header">
                <h1>Мои таблицы</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <label className="create-btn" style={{ cursor: 'pointer', background: '#34a853' }}>
                        Импорт CSV
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleImport}
                            style={{ display: 'none' }}
                        />
                    </label>
                    <button className="create-btn" onClick={() => setIsModalOpen(true)}>
                        Создать таблицу
                    </button>
                </div>
            </div>
            <div className="docs-grid">
                {docs.map(doc => (
                    <div key={doc.id} className="doc-card">
                        <div className="doc-preview" onClick={() => onOpen(doc)}>
                            {renderPreview(doc)}
                        </div>
                        <div className="doc-info">
                            <input
                                className="inline-title-edit"
                                defaultValue={doc.title}
                                onBlur={(e) => onRename(doc.id, e.target.value)}
                            />
                            <div className="doc-date">
                                Создан: {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                            <div className="doc-date">
                                Изменен: {new Date(doc.updatedAt).toLocaleString()}
                            </div>
                        </div>
                        <div className="doc-actions">
                            <button onClick={() => onDuplicate(doc)}>Копия</button>
                            <button className="delete-btn" onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('Удалить?')) onDelete(doc.id);
                            }}>Удалить</button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Новый документ</h3>
                        <input className="modal-input" value={name} onChange={e => setName(e.target.value)} placeholder="Название" />
                        <div className="dim-inputs">
                            <label>Строк: <input type="number" value={dims.r} onChange={e => setDims({ ...dims, r: +e.target.value })} /></label>
                            <label>Столбцов: <input type="number" value={dims.c} onChange={e => setDims({ ...dims, c: +e.target.value })} /></label>
                        </div>
                        <div className="modal-buttons">
                            <button onClick={() => { onCreate(name, dims.r, dims.c); setIsModalOpen(false); }}>Создать</button>
                            <button onClick={() => setIsModalOpen(false)}>Отмена</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;