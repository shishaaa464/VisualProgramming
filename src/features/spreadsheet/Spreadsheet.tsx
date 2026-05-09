import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ROWS_COUNT, COLS_COUNT, DEFAULT_ROW_HEIGHT, DEFAULT_COL_WIDTH, ROW_HEADER_WIDTH } from './constants';
import { evaluateFormula } from './formulaParser';
import './Spreadsheet.css';

const Spreadsheet: React.FC = () => {
    const [data, setData] = useState<Record<string, string>>({});
    const [rowsCount, setRowsCount] = useState(ROWS_COUNT);
    const [colsCount, setColsCount] = useState(COLS_COUNT);

    const [anchorCell, setAnchorCell] = useState<{ col: string, row: number } | null>(null);
    const [focusCell, setFocusCell] = useState<{ col: string, row: number } | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState('');
    const [scrollTop, setScrollTop] = useState(0);
    const [colWidths, setColWidths] = useState<Record<string, number>>({});
    const [rowHeights, setRowHeights] = useState<Record<number, number>>({});

    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, type: 'row' | 'col', index: number | string } | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const HEADER_HEIGHT = 30;

    const dynamicColLabels = useMemo(() => {
        return Array.from({ length: colsCount }, (_, i) => {
            let label = '';
            let n = i;
            while (n >= 0) {
                label = String.fromCharCode((n % 26) + 65) + label;
                n = Math.floor(n / 26) - 1;
            }
            return label;
        });
    }, [colsCount]);

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

    const totalHeight = rowOffsets[rowsCount] + HEADER_HEIGHT;
    const getColIdx = (label: string) => {
        let idx = 0;
        for (let i = 0; i < label.length; i++) {
            idx = idx * 26 + (label.charCodeAt(i) - 64);
        }
        return idx - 1;
    };

    const handleAddRow = (index: number) => {
        const rowToInsertAfter = index + 1;
        const newData: Record<string, string> = {};

        Object.entries(data).forEach(([key, value]) => {
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const col = match[1];
                const row = parseInt(match[2]);

                if (row > rowToInsertAfter) {
                    newData[`${col}${row + 1}`] = value;
                } else {
                    newData[key] = value;
                }
            }
        });

        setData(newData);
        setRowsCount(prev => prev + 1);
        setContextMenu(null);
    };

    const handleDeleteRow = (index: number) => {
        const rowToDelete = index + 1;
        const newData: Record<string, string> = {};

        Object.entries(data).forEach(([key, value]) => {
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const col = match[1];
                const row = parseInt(match[2]);

                if (row === rowToDelete) return;

                if (row > rowToDelete) {
                    newData[`${col}${row - 1}`] = value;
                } else {
                    newData[key] = value;
                }
            }
        });

        setData(newData);
        setRowsCount(prev => prev - 1);
        setContextMenu(null);
    };

    const handleAddCol = (colLabel: string) => {
        const targetIdx = getColIdx(colLabel);
        const newData: Record<string, string> = {};

        Object.entries(data).forEach(([key, value]) => {
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const col = match[1];
                const row = match[2];
                const currentIdx = getColIdx(col);

                if (currentIdx > targetIdx) {
                    const nextLabel = dynamicColLabels[currentIdx + 1];
                    newData[`${nextLabel}${row}`] = value;
                } else {
                    newData[key] = value;
                }
            }
        });

        setData(newData);
        setColsCount(prev => prev + 1);
        setContextMenu(null);
    };

    const handleDeleteCol = (colLabel: string) => {
        const targetIdx = getColIdx(colLabel);
        const newData: Record<string, string> = {};

        Object.entries(data).forEach(([key, value]) => {
            const match = key.match(/^([A-Z]+)(\d+)$/);
            if (match) {
                const col = match[1];
                const row = match[2];
                const currentIdx = getColIdx(col);

                if (currentIdx === targetIdx) return;

                if (currentIdx > targetIdx) {
                    const prevLabel = dynamicColLabels[currentIdx - 1];
                    newData[`${prevLabel}${row}`] = value;
                } else {
                    newData[key] = value;
                }
            }
        });

        setData(newData);
        setColsCount(prev => prev - 1);
        setContextMenu(null);
    };

    const onContextMenu = (e: React.MouseEvent, type: 'row' | 'col', index: number | string) => {
        e.preventDefault();
        setContextMenu({ x: e.pageX, y: e.pageY, type, index });
    };

    useEffect(() => {
        const hideMenu = () => setContextMenu(null);
        window.addEventListener('click', hideMenu);
        return () => window.removeEventListener('click', hideMenu);
    }, []);

    const startResizing = (e: React.MouseEvent, type: 'col' | 'row', id: string | number, startSize: number) => {
        e.preventDefault();
        e.stopPropagation();
        const startPos = type === 'col' ? e.pageX : e.pageY;
        const onMouseMove = (moveEvent: MouseEvent) => {
            const currentPos = type === 'col' ? moveEvent.pageX : moveEvent.pageY;
            const newSize = Math.max(25, startSize + (currentPos - startPos));
            if (type === 'col') setColWidths(prev => ({ ...prev, [id]: newSize }));
            else setRowHeights(prev => ({ ...prev, [id as number]: newSize }));
        };
        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    const checkSelection = useMemo(() => {
        if (!anchorCell || !focusCell) return { isIn: () => false, minC: 'A', maxC: 'A', minR: 1, maxR: 1 };
        const aIdx = getColIdx(anchorCell.col);
        const fIdx = getColIdx(focusCell.col);
        const minCIdx = Math.min(aIdx, fIdx);
        const maxCIdx = Math.max(aIdx, fIdx);
        const minR = Math.min(anchorCell.row, focusCell.row);
        const maxR = Math.max(anchorCell.row, focusCell.row);
        return {
            isIn: (col: string, row: number) => {
                const c = getColIdx(col);
                return c >= minCIdx && c <= maxCIdx && row >= minR && row <= maxR;
            },
            minC: dynamicColLabels[minCIdx], maxC: dynamicColLabels[maxCIdx], minR, maxR
        };
    }, [anchorCell, focusCell, dynamicColLabels]);

    const selectionRect = useMemo(() => {
        if (!anchorCell || !focusCell) return null;
        const { minC, maxC, minR, maxR } = checkSelection;
        const x = ROW_HEADER_WIDTH + colOffsets[minC];
        const y = rowOffsets[minR - 1] + HEADER_HEIGHT;
        const width = (colOffsets[maxC] + (colWidths[maxC] || DEFAULT_COL_WIDTH)) - colOffsets[minC];
        const height = (rowOffsets[maxR] - rowOffsets[minR - 1]);
        return { x, y, width, height };
    }, [checkSelection, colOffsets, rowOffsets, colWidths]);

    const startIndex = useMemo(() => {
        const idx = rowOffsets.findIndex(o => o > scrollTop - 100);
        return idx === -1 ? 0 : Math.max(0, idx - 1);
    }, [rowOffsets, scrollTop]);

    const endIndex = useMemo(() => {
        const idx = rowOffsets.findIndex(o => o > scrollTop + 1000);
        return idx === -1 ? rowsCount : Math.min(rowsCount, idx + 2);
    }, [rowOffsets, scrollTop, rowsCount]);

    useEffect(() => {
        if (isEditing && inputRef.current) inputRef.current.focus();
    }, [isEditing]);

    const handleCellMouseDown = (col: string, row: number, e: React.MouseEvent) => {
        if (e.shiftKey && anchorCell) {
            setFocusCell({ col, row });
        } else {
            setAnchorCell({ col, row });
            setFocusCell({ col, row });
            setIsEditing(false);
            setEditValue('');
        }
    };

    const saveEdit = (id: string) => {
        setData(p => ({ ...p, [id]: editValue }));
        setIsEditing(false);
    };

    const renderRows = useMemo(() => {
        const rows = [];
        for (let i = startIndex; i < endIndex; i++) {
            const rowNum = i + 1;
            const h = rowHeights[i] || DEFAULT_ROW_HEIGHT;
            const rowTop = rowOffsets[i] + HEADER_HEIGHT;

            rows.push(
                <div key={i} className="spreadsheet-row" style={{ top: rowTop, height: h }}>
                    <div
                        className="row-header"
                        style={{ width: ROW_HEADER_WIDTH, height: h }}
                        onContextMenu={(e) => onContextMenu(e, 'row', i)}
                    >
                        {rowNum}
                        <div className="resizer-h-header" onMouseDown={(e) => startResizing(e, 'row', i, h)} />
                    </div>
                    {dynamicColLabels.map(col => {
                        const id = `${col}${rowNum}`;
                        const isAnchor = anchorCell?.col === col && anchorCell?.row === rowNum;
                        const w = colWidths[col] || DEFAULT_COL_WIDTH;
                        const val = data[id] || '';
                        const display = val.startsWith('=') ? evaluateFormula(val, data) : val;
                        return (
                            <div
                                key={id}
                                className={`cell ${checkSelection.isIn(col, rowNum) ? 'cell-in-selection' : ''}`}
                                style={{ width: w, height: h }}
                                onMouseDown={(e) => handleCellMouseDown(col, rowNum, e)}
                                onDoubleClick={() => { setEditValue(val); setIsEditing(true); }}
                            >
                                {isEditing && isAnchor ? (
                                    <input
                                        ref={inputRef} className="cell-input"
                                        value={editValue} onChange={e => setEditValue(e.target.value)}
                                        onBlur={() => saveEdit(id)} onKeyDown={ev => ev.key === 'Enter' && saveEdit(id)}
                                    />
                                ) : <div className="cell-content">{display}</div>}
                            </div>
                        );
                    })}
                </div>
            );
        }
        return rows;
    }, [startIndex, endIndex, data, anchorCell, isEditing, editValue, colWidths, rowHeights, rowOffsets, checkSelection, dynamicColLabels]);

    return (
        <div
            className="spreadsheet-wrapper"
            tabIndex={0}
            onKeyDown={e => {
                if (!isEditing && e.key === 'Enter' && anchorCell) {
                    const currentId = `${anchorCell.col}${anchorCell.row}`;
                    setEditValue(data[currentId] || '');
                    setIsEditing(true);
                }
            }}
        >
            <div className="formula-bar">
                <div className="address-box">{anchorCell ? `${anchorCell.col}${anchorCell.row}` : ''}</div>
                <input
                    className="formula-input"
                    value={isEditing ? editValue : (anchorCell ? data[`${anchorCell.col}${anchorCell.row}`] || '' : '')}
                    onChange={e => { setEditValue(e.target.value); setIsEditing(true); }}
                />
            </div>
            <div className="spreadsheet-container" onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
                <div style={{ height: totalHeight, position: 'relative', width: 'fit-content' }}>
                    <div className="spreadsheet-header-row" style={{ height: HEADER_HEIGHT }}>
                        <div className="row-header-spacer" style={{ width: ROW_HEADER_WIDTH }} />
                        {dynamicColLabels.map(l => (
                            <div
                                key={l}
                                className="col-header"
                                style={{ width: colWidths[l] || DEFAULT_COL_WIDTH }}
                                onContextMenu={(e) => onContextMenu(e, 'col', l)}
                            >
                                {l}
                                <div className="resizer-v" onMouseDown={(e) => startResizing(e, 'col', l, colWidths[l] || DEFAULT_COL_WIDTH)} />
                            </div>
                        ))}
                    </div>
                    {anchorCell && selectionRect && (
                        <div
                            className="selection-border"
                            style={{
                                left: selectionRect.x - 1,
                                top: selectionRect.y - 1,
                                width: selectionRect.width + 1,
                                height: selectionRect.height + 1
                            }}
                        >
                            <div className="selection-fill-handle" />
                        </div>
                    )}
                    {renderRows}
                </div>
            </div>

            {contextMenu && (
                <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                    {contextMenu.type === 'row' ? (
                        <>
                            <div className="menu-item" onClick={() => handleAddRow(contextMenu.index as number)}>Добавить строку ниже</div>
                            <div className="menu-item" onClick={() => handleDeleteRow(contextMenu.index as number)}>Удалить строку</div>
                        </>
                    ) : (
                        <>
                            <div className="menu-item" onClick={() => handleAddCol(contextMenu.index as string)}>Добавить столбец справа</div>
                            <div className="menu-item" onClick={() => handleDeleteCol(contextMenu.index as string)}>Удалить столбец</div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default Spreadsheet;