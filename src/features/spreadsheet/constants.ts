export const ROWS_COUNT = 1000;
export const COLS_COUNT = 26;
export const DEFAULT_ROW_HEIGHT = 30;
export const DEFAULT_COL_WIDTH = 100;
export const ROW_HEADER_WIDTH = 40;
export const HEADER_HEIGHT = 30;

export const COL_LABELS = Array.from({ length: COLS_COUNT }, (_, i) =>
    String.fromCharCode(65 + i)
);