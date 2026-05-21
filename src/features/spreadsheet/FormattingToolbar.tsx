import React from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { applyStyleToSelection } from '../../store/slices/spreadsheetSlice';
import './FormattingToolbar.css';

interface FormattingToolbarProps {
    selectedCell: { col: string; row: number } | null;
    selectionRange: { startCol: string; startRow: number; endCol: string; endRow: number } | null;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({ selectedCell, selectionRange }) => {
    const dispatch = useAppDispatch();
    const data = useAppSelector((state) => state.spreadsheet.data);

    const currentStyle = selectedCell
        ? data[`${selectedCell.col}${selectedCell.row}`]?.style
        : null;

    const applyFormat = (formatType: string, value: any) => {
        if (!selectedCell && !selectionRange) return;

        const range = selectionRange || {
            startCol: selectedCell!.col,
            startRow: selectedCell!.row,
            endCol: selectedCell!.col,
            endRow: selectedCell!.row
        };

        dispatch(applyStyleToSelection({
            selection: range,
            style: { [formatType]: value }
        }));
    };

    const handleBold = () => {
        applyFormat('bold', !currentStyle?.bold);
    };

    const handleItalic = () => {
        applyFormat('italic', !currentStyle?.italic);
    };

    const handleUnderline = () => {
        applyFormat('underline', !currentStyle?.underline);
    };

    const handleTextAlign = (align: 'left' | 'center' | 'right') => {
        applyFormat('textAlign', align);
        console.log('Выравнивание применено:', align);
    };

    const handleBackgroundColor = (color: string) => {
        applyFormat('backgroundColor', color);
    };

    const handleTextColor = (color: string) => {
        applyFormat('textColor', color);
    };

    const handleNumberFormat = (format: 'number' | 'percent' | 'currency' | 'date') => {
        applyFormat('numberFormat', format);
    };

    return (
        <div className="formatting-toolbar">
            <div className="format-group">
                <button
                    className={`format-btn ${currentStyle?.bold ? 'active' : ''}`}
                    onClick={handleBold}
                    title="Жирный (Ctrl+B)"
                >
                    <strong>B</strong>
                </button>
                <button
                    className={`format-btn ${currentStyle?.italic ? 'active' : ''}`}
                    onClick={handleItalic}
                    title="Курсив (Ctrl+I)"
                >
                    <em>I</em>
                </button>
                <button
                    className={`format-btn ${currentStyle?.underline ? 'active' : ''}`}
                    onClick={handleUnderline}
                    title="Подчеркивание (Ctrl+U)"
                >
                    <u>U</u>
                </button>
            </div>

            <div className="format-group">
                <button
                    className={`format-btn ${currentStyle?.textAlign === 'left' ? 'active' : ''}`}
                    onClick={() => handleTextAlign('left')}
                    title="По левому краю"
                >
                    ⬅
                </button>
                <button
                    className={`format-btn ${currentStyle?.textAlign === 'center' ? 'active' : ''}`}
                    onClick={() => handleTextAlign('center')}
                    title="По центру"
                >
                    ⬌
                </button>
                <button
                    className={`format-btn ${currentStyle?.textAlign === 'right' ? 'active' : ''}`}
                    onClick={() => handleTextAlign('right')}
                    title="По правому краю"
                >
                    ⮕
                </button>
            </div>

            <div className="format-group">
                <div className="color-picker-wrapper" title="Цвет фона">
                    <input
                        type="color"
                        value={currentStyle?.backgroundColor || '#ffffff'}
                        onChange={(e) => handleBackgroundColor(e.target.value)}
                    />
                    <span className="color-label">Фон</span>
                </div>
                <div className="color-picker-wrapper" title="Цвет текста">
                    <input
                        type="color"
                        value={currentStyle?.textColor || '#000000'}
                        onChange={(e) => handleTextColor(e.target.value)}
                    />
                    <span className="color-label">Текст</span>
                </div>
            </div>

            <div className="format-group">
                <select
                    onChange={(e) => handleNumberFormat(e.target.value as any)}
                    value={currentStyle?.numberFormat || 'number'}
                >
                    <option value="number">🔢 Число</option>
                    <option value="percent">% Процент</option>
                    <option value="currency">₽ Валюта</option>
                    <option value="date">📅 Дата</option>
                </select>
            </div>
        </div>
    );
};

export default FormattingToolbar;