export interface Book {
    id: number;
    title: string;
    isbn: string;
    pageCount: number;
    authors: string[];
}

export interface BookWithCover extends Book {
    coverImage?: string;
}

export interface GoogleBooksResponse {
    items: Array<{
        volumeInfo: {
            imageLinks?: {
                thumbnail: string;
            };
        };
    }>;
}