import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ROWS_COUNT, COLS_COUNT, DEFAULT_ROW_HEIGHT, DEFAULT_COL_WIDTH, ROW_HEADER_WIDTH, HEADER_HEIGHT } from './constants';
import { evaluateFormula } from './formulaParser';
import type { SpreadsheetData, SpreadsheetDoc, CellData, CellValue } from '../../types/spreadsheet';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateCell, setData, undo, redo, setInitialData, applyStyleToSelection } from '../../store/slices/spreadsheetSlice';
import { updateDocumentThunk } from '../../store/slices/documentsSlice';
import FormattingToolbar from './FormattingToolbar';
import './Spreadsheet.css';
import './NavPanel.css';

interface SpreadsheetProps {
    initialDoc: SpreadsheetDoc;
}

const Spreadsheet: React.FC<SpreadsheetProps> = ({ initialDoc }) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector((state) => state.spreadsheet.data);
    const activeDocId = useAppSelector((state) => state.documents.activeDocId);
    const [rowsCount, setRowsCount] = useState(initialDoc.rows || ROWS_COUNT);
    const [colsCount, setColsCount] = useState(initialDoc.cols || COLS_COUNT);
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const [anchorCell, setAnchorCell] = useState<{ col: string; row: number } | null>(null);
    const [focusCell, setFocusCell] = useState<{ col: string; row: number } | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'col' | 'row'; index: number | string } | null>(null);

    const isDirty = useRef(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const formatValueByType = (value: CellValue, format?: string): string => {
        if (value === null || value === undefined || value === '') return '';

        const stringValue = String(value);

        if (!format || format === 'number') return stringValue;

        if (format === 'date') {
            const num = parseFloat(stringValue);
            if (!isNaN(num) && num > 100000 && num < 10000000000) {
                return new Date(num).toLocaleDateString('ru-RU');
            }
            const parsedDate = new Date(stringValue);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toLocaleDateString('ru-RU');
            }
            return stringValue;
        }

        const num = parseFloat(stringValue);
        if (isNaN(num)) return stringValue;

        switch (format) {
            case 'percent':
                return `${(num * 100).toFixed(2)}%`;
            case 'currency':
                return `${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₽`;
            default:
                return stringValue;
        }
    };

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

    const getSelectionRange = () => {
        if (!anchorCell) return null;
        const focus = focusCell || anchorCell;
        return {
            startCol: anchorCell.col,
            startRow: anchorCell.row,
            endCol: focus.col,
            endRow: focus.row
        };
    };

    const copySelection = () => {
        if (!anchorCell || !focusCell) return;

        const startColIdx = getColIdx(anchorCell.col);
        const endColIdx = getColIdx(focusCell.col);
        const startRow = Math.min(anchorCell.row, focusCell.row);
        const endRow = Math.max(anchorCell.row, focusCell.row);

        const copied: Record<string, CellData> = {};

        for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
            const col = getColLabel(colIdx);
            for (let row = startRow; row <= endRow; row++) {
                const cellId = `${col}${row}`;
                if (data[cellId]) {
                    copied[cellId] = { ...data[cellId] };
                }
            }
        }

        localStorage.setItem('spreadsheet_clipboard', JSON.stringify(copied));
    };

    const cutSelection = () => {
        copySelection();
        clearSelection();
    };

    const clearSelection = () => {
        if (!anchorCell || !focusCell) return;

        const startColIdx = getColIdx(anchorCell.col);
        const endColIdx = getColIdx(focusCell.col);
        const startRow = Math.min(anchorCell.row, focusCell.row);
        const endRow = Math.max(anchorCell.row, focusCell.row);

        for (let colIdx = startColIdx; colIdx <= endColIdx; colIdx++) {
            const col = getColLabel(colIdx);
            for (let row = startRow; row <= endRow; row++) {
                const cellId = `${col}${row}`;
                dispatch(updateCell({
                    id: cellId,
                    value: { rawContent: '', value: '', style: data[cellId]?.style }
                }));
            }
        }
        isDirty.current = true;
    };

    const pasteFromClipboard = () => {
        if (!anchorCell) return;

        const clipboardRaw = localStorage.getItem('spreadsheet_clipboard');
        if (!clipboardRaw) return;

        const clipboardData = JSON.parse(clipboardRaw);
        if (Object.keys(clipboardData).length === 0) return;

        const copiedIds = Object.keys(clipboardData);
        let minColIdx = Infinity, maxColIdx = -Infinity;
        let minRow = Infinity, maxRow = -Infinity;

        copiedIds.forEach(id => {
            const match = id.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const colIdx = getColIdx(match[1]);
                const row = parseInt(match[2]);
                minColIdx = Math.min(minColIdx, colIdx);
                maxColIdx = Math.max(maxColIdx, colIdx);
                minRow = Math.min(minRow, row);
                maxRow = Math.max(maxRow, row);
            }
        });

        const startColIdx = getColIdx(anchorCell.col);
        const startRow = anchorCell.row;

        for (let colOffset = 0; colOffset <= (maxColIdx - minColIdx); colOffset++) {
            const sourceColIdx = minColIdx + colOffset;
            const sourceCol = getColLabel(sourceColIdx);
            const targetColIdx = startColIdx + colOffset;
            if (targetColIdx >= colsCount) continue;
            const targetCol = getColLabel(targetColIdx);

            for (let rowOffset = 0; rowOffset <= (maxRow - minRow); rowOffset++) {
                const sourceRow = minRow + rowOffset;
                const targetRow = startRow + rowOffset;
                if (targetRow > rowsCount) continue;

                const sourceId = `${sourceCol}${sourceRow}`;
                const targetId = `${targetCol}${targetRow}`;

                if (clipboardData[sourceId]) {
                    dispatch(updateCell({
                        id: targetId,
                        value: { ...clipboardData[sourceId] }
                    }));
                }
            }
        }
        isDirty.current = true;
    };

    const selectAll = () => {
        setAnchorCell({ col: 'A', row: 1 });
        setFocusCell({ col: getColLabel(colsCount - 1), row: rowsCount });
    };

    const navigateCell = (direction: 'up' | 'down' | 'left' | 'right') => {
        if (!anchorCell) return;

        let newCol = anchorCell.col;
        let newRow = anchorCell.row;
        let colIdx = getColIdx(anchorCell.col);

        switch (direction) {
            case 'up':
                newRow = Math.max(1, anchorCell.row - 1);
                break;
            case 'down':
                newRow = Math.min(rowsCount, anchorCell.row + 1);
                break;
            case 'left':
                colIdx = Math.max(0, colIdx - 1);
                newCol = getColLabel(colIdx);
                break;
            case 'right':
                colIdx = Math.min(colsCount - 1, colIdx + 1);
                newCol = getColLabel(colIdx);
                break;
        }

        setAnchorCell({ col: newCol, row: newRow });
        setFocusCell({ col: newCol, row: newRow });
        setIsEditing(false);
    };

    const saveToServer = async () => {
        if (!activeDocId) return;

        setSaveStatus('saving');
        try {
            await dispatch(updateDocumentThunk({
                id: activeDocId,
                data: data
            })).unwrap();
            setSaveStatus('saved');
            isDirty.current = false;
        } catch (err) {
            setSaveStatus('error');
            console.error('Ошибка сохранения:', err);
        }
    };

    useEffect(() => {
        if (initialDoc.data) {
            dispatch(setInitialData(initialDoc.data));
        }
    }, [initialDoc.id, dispatch]);

    useEffect(() => {
        if (!activeDocId) return;

        if (saveTimerRef.current) {
            clearTimeout(saveTimerRef.current);
        }

        if (isDirty.current) {
            saveTimerRef.current = setTimeout(() => {
                saveToServer();
            }, 500);
        }

        return () => {
            if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
            }
        };
    }, [data, activeDocId]);

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
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    useEffect(() => {
        const handleSaveShortcut = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                saveToServer();
            }
        };
        window.addEventListener('keydown', handleSaveShortcut);
        return () => window.removeEventListener('keydown', handleSaveShortcut);
    }, [data]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (isEditing) {
                if (e.key === 'Escape') {
                    setIsEditing(false);
                    e.preventDefault();
                }
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch (e.key.toLowerCase()) {
                    case 's':
                        e.preventDefault();
                        saveToServer();
                        break;
                    case 'z':
                        e.preventDefault();
                        if (e.shiftKey) {
                            dispatch(redo());
                        } else {
                            dispatch(undo());
                        }
                        break;
                    case 'y':
                        e.preventDefault();
                        dispatch(redo());
                        break;
                    case 'c':
                        e.preventDefault();
                        copySelection();
                        break;
                    case 'x':
                        e.preventDefault();
                        cutSelection();
                        break;
                    case 'v':
                        e.preventDefault();
                        pasteFromClipboard();
                        break;
                    case 'a':
                        e.preventDefault();
                        selectAll();
                        break;
                    case 'b':
                        e.preventDefault();
                        if (anchorCell) {
                            const currentBold = data[`${anchorCell.col}${anchorCell.row}`]?.style?.bold;
                            const range = getSelectionRange();
                            if (range) {
                                dispatch(applyStyleToSelection({
                                    selection: range,
                                    style: { bold: !currentBold }
                                }));
                                isDirty.current = true;
                            }
                        }
                        break;
                    case 'i':
                        e.preventDefault();
                        if (anchorCell) {
                            const currentItalic = data[`${anchorCell.col}${anchorCell.row}`]?.style?.italic;
                            const range = getSelectionRange();
                            if (range) {
                                dispatch(applyStyleToSelection({
                                    selection: range,
                                    style: { italic: !currentItalic }
                                }));
                                isDirty.current = true;
                            }
                        }
                        break;
                    case 'u':
                        e.preventDefault();
                        if (anchorCell) {
                            const currentUnderline = data[`${anchorCell.col}${anchorCell.row}`]?.style?.underline;
                            const range = getSelectionRange();
                            if (range) {
                                dispatch(applyStyleToSelection({
                                    selection: range,
                                    style: { underline: !currentUnderline }
                                }));
                                isDirty.current = true;
                            }
                        }
                        break;
                }
                return;
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    navigateCell('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    navigateCell('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    navigateCell('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    navigateCell('right');
                    break;
                case 'Tab':
                    e.preventDefault();
                    if (e.shiftKey) {
                        navigateCell('left');
                    } else {
                        navigateCell('right');
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (anchorCell) {
                        setEditValue(data[`${anchorCell.col}${anchorCell.row}`]?.rawContent || '');
                        setIsEditing(true);
                    }
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    clearSelection();
                    break;
                case 'Escape':
                    setAnchorCell(null);
                    setFocusCell(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [dispatch, isEditing, anchorCell, focusCell, data, colsCount, rowsCount]);

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

        dispatch(updateCell({ id, value: newCell }));
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

        dispatch(setData(newData));
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

        dispatch(setData(newData));
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

        dispatch(setData(newData));
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

        dispatch(setData(newData));
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

                        const displayValue = cell
                            ? formatValueByType(cell.value, cell.style?.numberFormat)
                            : '';

                        return (
                            <div
                                key={id}
                                className={`cell ${inSelection ? 'cell-in-selection' : ''} ${isAnchor ? 'anchor' : ''} ${cell?.style?.textAlign === 'center' ? 'cell-align-center' :
                                    cell?.style?.textAlign === 'right' ? 'cell-align-right' : 'cell-align-left'
                                    }`}
                                style={{
                                    width: colWidths[col] || DEFAULT_COL_WIDTH,
                                    height: h,
                                    fontWeight: cell?.style?.bold ? 'bold' : 'normal',
                                    fontStyle: cell?.style?.italic ? 'italic' : 'normal',
                                    textDecoration: cell?.style?.underline ? 'underline' : 'none',
                                    backgroundColor: cell?.style?.backgroundColor || 'transparent',
                                    color: cell?.style?.textColor || 'inherit'
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
                                    <div className={`cell-content ${cell?.style?.textAlign === 'center' ? 'text-center' :
                                        cell?.style?.textAlign === 'right' ? 'text-right' : 'text-left'
                                        }`}>
                                        {displayValue}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return rows;
    }, [startIndex, endIndex, data, anchorCell, focusCell, isEditing, editValue, colWidths, rowHeights, rowOffsets, checkSelection, dynamicColLabels]);

    return (
        <div className="spreadsheet-wrapper" tabIndex={0}>
            <div className="top-nav-panel">
                <div className="doc-info-block">
                    <span className="doc-main-title">{initialDoc.title}</span>
                    <span className={`save-status ${saveStatus}`}>
                        {saveStatus === 'saving' ? '● Сохранение...' : saveStatus === 'error' ? '✗ Ошибка' : '✓ Сохранено'}
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

            <FormattingToolbar
                selectedCell={anchorCell}
                selectionRange={getSelectionRange()}
            />

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