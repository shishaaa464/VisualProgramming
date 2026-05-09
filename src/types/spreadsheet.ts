export type CellValue = string | number | boolean;

export interface CellData {
    value: CellValue;
    rawContent: string;
    style?: {
        bold?: boolean;
        italic?: boolean;
    };
}

export type SpreadsheetData = Record<string, CellData>;