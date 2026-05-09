export interface CellStyle {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    backgroundColor?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    numberFormat?: 'number' | 'percent' | 'currency' | 'date';
}

export interface CellData {
    rawContent: string;
    value: CellValue;
    style?: CellStyle;
}

export type CellValue = string | number | boolean | null;

export interface SpreadsheetData {
    [cellId: string]: CellData;
}

export interface SpreadsheetDoc {
    id: string;
    title: string;
    rows: number;
    cols: number;
    data: SpreadsheetData;
    createdAt: number;
    updatedAt: number;
    ownerId: string;
}