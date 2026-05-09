import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ROWS_COUNT, COLS_COUNT, DEFAULT_ROW_HEIGHT, DEFAULT_COL_WIDTH, ROW_HEADER_WIDTH, HEADER_HEIGHT } from './constants';
import { evaluateFormula } from './formulaParser';
import type { SpreadsheetData, SpreadsheetDoc, CellData, CellValue } from '../../types/spreadsheet';
import './Spreadsheet.css';
import './NavPanel.css';

interface SpreadsheetProps {
    initialDoc: SpreadsheetDoc;
    onAutoSave: (data: SpreadsheetData) => void;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ initialDoc, onAutoSave }) => {
    const [data, setData] = useState<SpreadsheetData>(initialDoc.data || {});
    const [rowsCount, setRowsCount] = useState(initialDoc.rows || ROWS_COUNT);
    const [colsCount, setColsCount] = useState(initialDoc.cols || COLS_COUNT);
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const [anchorCell, setAnchorCell] = useState<{ col: string, row: number } | null>(null);
    const [focusCell, setFocusCell] = useState<{ col: string, row: number } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'col' | 'row', index: number | string } | null>(null);

    const isDirty = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const getColLabel = (index: number): string => {
        let label = '';
        let n = index;
        while (n >= 0) {
            label = String.fromCharCode((n % 26) + 65) + label;
            n = Math.floor(n / 26) - 1;
        }
        return label;
    };

    const getColIdx = (col: string): number => {
        let idx = 0;
        for (let i = 0; i < col.length; i++) {
            idx = idx * 26 + (col.charCodeAt(i) - 64);
        }
        return idx - 1;
    };

    const getPlainDataForParser = (currentData: SpreadsheetData): Record<string, string> => {
        const plain: Record<string, string> = {};
        Object.entries(currentData).forEach(([key, cell]) => {
            plain[key] = String(cell?.value ?? '');
        });
        return plain;
    };

    useEffect(() => {
        if (!isDirty.current) return;
        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            try {
                onAutoSave(data);
                setSaveStatus('saved');
                isDirty.current = false;
            } catch (err) {
                setSaveStatus('error');
                console.error('Ошибка сохранения:', err);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [data, onAutoSave]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                onAutoSave(data);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data]);

    const saveEdit = (col: string, row: number) => {
        const id = `${col}${row}`;
        const plainData = getPlainDataForParser(data);

        const calculatedValue: CellValue = editValue.startsWith('=')
            ? evaluateFormula(editValue, plainData)
            : editValue;

        const newCell: CellData = {
            rawContent: editValue,
            value: calculatedValue,
            style: data[id]?.style
        };

        setData(prev => ({ ...prev, [id]: newCell }));
        isDirty.current = true;
        setIsEditing(false);
    };

    const exportToCSV = () => {
        const labels = Array.from({ length: colsCount }, (_, i) => getColLabel(i));
        const rows = ["sep=;"];

        for (let r = 1; r <= rowsCount; r++) {
            const rowData = labels.map(c => {
                const val = data[`${c}${r}`]?.value ?? '';
                return `"${String(val).replace(/"/g, '""')}"`;
            });
            rows.push(rowData.join(';'));
        }

        const blob = new Blob(["\ufeff" + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${initialDoc.title}.csv`;
        link.click();
    };

    const exportToJSON = () => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${initialDoc.title}.json`;
        link.click();
    };

    const handleAddCol = (colLabel: string) => {
        const targetIdx = getColIdx(colLabel);
        const newData: SpreadsheetData = {};

        Object.entries(data).forEach(([key, val]) => {
            const m = key.match(/^([A-Z]+)(\d+)$/);
            if (m) {
                const c = m[1];
                const r = m[2];
                const currentIdx = getColIdx(c);

                if (currentIdx > targetIdx) {
                    const newColLabel = getColLabel(currentIdx + 1);
                    newData[`${newColLabel}${r}`] = val;
                } else {
                    newData[key] = val;
                }
            }
        });

        setData(newData);
        setColsCount(prev => prev + 1);
        isDirty.current = true;
    };

    const handleDeleteCol = (colLabel: string) => {
        const targetIdx = getColIdx(colLabel);
        const newData: SpreadsheetData = {};

        Object.entries(data).forEach(([key, val]) => {
            const m = key.match(/^([A-Z]+)(\d+)$/);
            if (m) {
                const c = m[1];
                const r = m[2];
                const currentIdx = getColIdx(c);

                if (currentIdx === targetIdx) return;

                if (currentIdx > targetIdx) {
                    const newColLabel = getColLabel(currentIdx - 1);
                    newData[`${newColLabel}${r}`] = val;
                } else {
                    newData[key] = val;
                }
            }
        });

        setData(newData);
        setColsCount(prev => Math.max(1, prev - 1));
        isDirty.current = true;
    };

    const handleAddRow = (index: number) => {
        const target = index + 1;
        const newData: SpreadsheetData = {};

        Object.entries(data).forEach(([key, val]) => {
            const m = key.match(/^([A-Z]+)(\d+)$/);
            if (m) {
                const c = m[1];
                const r = parseInt(m[2]);
                if (r > target) {
                    newData[`${c}${r + 1}`] = val;
                } else {
                    newData[key] = val;
                }
            }
        });

        setData(newData);
        setRowsCount(prev => prev + 1);
        isDirty.current = true;
    };

    const handleDeleteRow = (index: number) => {
        const target = index + 1;
        const newData: SpreadsheetData = {};

        Object.entries(data).forEach(([key, val]) => {
            const m = key.match(/^([A-Z]+)(\d+)$/);
            if (m) {
                const c = m[1];
                const r = parseInt(m[2]);

                if (r === target) return;

                if (r > target) {
                    newData[`${c}${r - 1}`] = val;
                } else {
                    newData[key] = val;
                }
            }
        });

        setData(newData);
        setRowsCount(prev => Math.max(1, prev - 1));
        isDirty.current = true;
    };

    const startResizing = (e: React.MouseEvent, type: 'col' | 'row', id: string | number, startSize: number) => {
        e.preventDefault();
        const startPos = type === 'col' ? e.pageX : e.pageY;
        const move = (me: MouseEvent) => {
            const currentPos = type === 'col' ? me.pageX : me.pageY;
            const newSize = Math.max(30, startSize + (currentPos - startPos));
            if (type === 'col') setColWidths(p => ({ ...p, [id]: newSize }));
            else setRowHeights(p => ({ ...p, [id as number]: newSize }));
        };
        const up = () => {
            document.removeEventListener('mousemove', move);
            document.removeEventListener('mouseup', up);
        };
        document.addEventListener('mousemove', move);
        document.addEventListener('mouseup', up);
    };

    const dynamicColLabels = useMemo(() => Array.from({ length: colsCount }, (_, i) => getColLabel(i)), [colsCount]);

    const colOffsets = useMemo(() => {
        const offsets: Record<string, number> = {};
        let current = 0;
        dynamicColLabels.forEach(col => {
            offsets[col] = current;
            current += (colWidths[col] || DEFAULT_COL_WIDTH);
        });
        return offsets;
    }, [colWidths, dynamicColLabels]);

    const rowOffsets = useMemo(() => {
        const offsets = [0];
        for (let i = 0; i < rowsCount; i++) {
            offsets.push(offsets[i] + (rowHeights[i] || DEFAULT_ROW_HEIGHT));
        }
        return offsets;
    }, [rowHeights, rowsCount]);

    const checkSelection = useMemo(() => {
        if (!anchorCell || !focusCell) return { isIn: () => false, minC: 'A', maxC: 'A', minR: 1, maxR: 1 };
        const aIdx = getColIdx(anchorCell.col), fIdx = getColIdx(focusCell.col);
        const minCIdx = Math.min(aIdx, fIdx), maxCIdx = Math.max(aIdx, fIdx);
        const minR = Math.min(anchorCell.row, focusCell.row), maxR = Math.max(anchorCell.row, focusCell.row);
        return {
            isIn: (col: string, row: number) => {
                const c = getColIdx(col);
                return c >= minCIdx && c <= maxCIdx && row >= minR && row <= maxR;
            },
            minC: getColLabel(minCIdx), maxC: getColLabel(maxCIdx), minR, maxR
        };
    }, [anchorCell, focusCell]);

    const selectionRect = useMemo(() => {
        if (!anchorCell || !focusCell) return null;
        const { minC, maxC, minR, maxR } = checkSelection;
        const x = ROW_HEADER_WIDTH + colOffsets[minC];
        const y = rowOffsets[minR - 1] + HEADER_HEIGHT;
        const width = (colOffsets[maxC] + (colWidths[maxC] || DEFAULT_COL_WIDTH)) - colOffsets[minC];
        const height = (rowOffsets[maxR] - rowOffsets[minR - 1]);
        return { x, y, width, height };
    }, [checkSelection, colOffsets, rowOffsets, colWidths]);

    const startIndex = Math.max(0, Math.floor(scrollTop / DEFAULT_ROW_HEIGHT) - 5);
    const endIndex = Math.min(rowsCount, startIndex + 40);

    const renderRows = useMemo(() => {
        const rows = [];
        for (let i = startIndex; i < endIndex; i++) {
            const rowNum = i + 1;
            const h = rowHeights[i] || DEFAULT_ROW_HEIGHT;
            const rowTop = rowOffsets[i] + HEADER_HEIGHT;

            rows.push(
                <div key={i} className="spreadsheet-row" style={{ top: rowTop, height: h }}>
                    <div className="row-header" style={{ width: ROW_HEADER_WIDTH, height: h }}
                        onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({ x: e.pageX, y: e.pageY, type: 'row', index: i });
                        }}>
                        {rowNum}
                        <div className="resizer-h-header" onMouseDown={(e) => startResizing(e, 'row', i, h)} />
                    </div>
                    {dynamicColLabels.map(col => {
                        const id = `${col}${rowNum}`;
                        const isAnchor = anchorCell?.col === col && anchorCell?.row === rowNum;
                        const cell = data[id];
                        const inSelection = checkSelection.isIn(col, rowNum);

                        return (
                            <div
                                key={id}
                                className={`cell ${inSelection ? 'cell-in-selection' : ''} ${isAnchor ? 'anchor' : ''}`}
                                style={{
                                    width: colWidths[col] || DEFAULT_COL_WIDTH,
                                    height: h,
                                    fontWeight: cell?.style?.bold ? 'bold' : 'normal',
                                    fontStyle: cell?.style?.italic ? 'italic' : 'normal'
                                }}
                                onMouseDown={(e) => {
                                    if (e.shiftKey && anchorCell) {
                                        setFocusCell({ col, row: rowNum });
                                    } else {
                                        setAnchorCell({ col, row: rowNum });
                                        setFocusCell({ col, row: rowNum });
                                        setIsEditing(false);
                                    }
                                }}
                                onDoubleClick={() => {
                                    setEditValue(cell?.rawContent || '');
                                    setIsEditing(true);
                                }}
                            >
                                {isEditing && isAnchor ? (
                                    <input
                                        ref={inputRef}
                                        className="cell-input"
                                        value={editValue}
                                        onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit(col, rowNum)}
                                        onKeyDown={ev => ev.key === 'Enter' && saveEdit(col, rowNum)}
                                    />
                                ) : (
                                    <div className="cell-content">{cell ? String(cell.value) : ''}</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return rows;
    }, [startIndex, endIndex, data, anchorCell, isEditing, editValue, colWidths, rowHeights, rowOffsets, checkSelection, dynamicColLabels]);

    return (
        <div className="spreadsheet-wrapper" tabIndex={0} onKeyDown={e => {
            if (!isEditing && e.key === 'Enter' && anchorCell) {
                setEditValue(data[`${anchorCell.col}${anchorCell.row}`]?.rawContent || '');
                setIsEditing(true);
            }
        }}>
            <div className="top-nav-panel">
                <div className="doc-info-block">
                    <span className="doc-main-title">{initialDoc.title}</span>
                    <span className={`save-status ${saveStatus}`}>
                        {saveStatus === 'saving' ? '● Сохранение...' : '✓ Сохранено'}
                    </span>
                </div>
                <div className="nav-actions">
                    <button className="nav-btn" onClick={exportToCSV}>Экспорт CSV</button>
                    <button className="nav-btn" onClick={exportToJSON}>JSON</button>
                </div>
            </div>

            <div className="formula-bar">
                <div className="address-box">{anchorCell ? `${anchorCell.col}${anchorCell.row}` : ''}</div>
                <input
                    className="formula-input"
                    value={isEditing ? editValue : (anchorCell ? data[`${anchorCell.col}${anchorCell.row}`]?.rawContent || '' : '')}
                    onChange={e => { setEditValue(e.target.value); setIsEditing(true); }}
                />
            </div>

            <div className="spreadsheet-container" onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
                <div style={{ height: rowOffsets[rowsCount] + HEADER_HEIGHT + 100, position: 'relative', width: 'fit-content' }}>
                    <div className="spreadsheet-header-row" style={{ height: HEADER_HEIGHT }}>
                        <div className="row-header-spacer" style={{ width: ROW_HEADER_WIDTH }} />
                        {dynamicColLabels.map(l => (
                            <div key={l} className="col-header" style={{ width: colWidths[l] || DEFAULT_COL_WIDTH }}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setContextMenu({ x: e.pageX, y: e.pageY, type: 'col', index: l });
                                }}>
                                {l}
                                <div className="resizer-v" onMouseDown={(e) => startResizing(e, 'col', l, colWidths[l] || DEFAULT_COL_WIDTH)} />
                            </div>
                        ))}
                    </div>
                    {anchorCell && selectionRect && (
                        <div className="selection-border" style={{
                            left: selectionRect.x - 1,
                            top: selectionRect.y - 1,
                            width: selectionRect.width + 1,
                            height: selectionRect.height + 1
                        }}>
                            <div className="selection-fill-handle" />
                        </div>
                    )}
                    {renderRows}
                </div>
            </div>

            {contextMenu && (
                <div className="context-menu" style={{
                    top: contextMenu.y,
                    left: contextMenu.x,
                    position: 'fixed',
                    zIndex: 500,
                    background: 'white',
                    border: '1px solid #ccc',
                    boxShadow: '2px 2px 5px rgba(0,0,0,0.1)'
                }} onClick={() => setContextMenu(null)}>
                    {contextMenu.type === 'row' ? (
                        <>
                            <div className="menu-item" onClick={() => handleAddRow(contextMenu.index as number)}>
                                Добавить строку ниже
                            </div>
                            <div className="menu-item" style={{ color: 'red' }} onClick={() => handleDeleteRow(contextMenu.index as number)}>
                                Удалить строку
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="menu-item" onClick={() => handleAddCol(contextMenu.index as string)}>
                                Добавить столбец справа
                            </div>
                            <div className="menu-item" style={{ color: 'red' }} onClick={() => handleDeleteCol(contextMenu.index as string)}>
                                Удалить столбец
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Spreadsheet;