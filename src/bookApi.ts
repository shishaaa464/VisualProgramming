import type { Book, GoogleBooksResponse, BookWithCover } from './Book';

const BOOKS_API_URL = 'https://fakeapi.extendsclass.com/books';
const GOOGLE_BOOKS_API_URL = 'https://www.googleapis.com/books/v1/volumes';

export const fetchBooks = async (): Promise<Book[]> => {
    const response = await fetch(BOOKS_API_URL);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};

export const fetchBookCoverByIsbn = async (isbn: string): Promise<string | null> => {
    try {
        const url = `${GOOGLE_BOOKS_API_URL}?q=isbn:${isbn}`;
        const response = await fetch(url);

        if (!response.ok) return null;

        const data: GoogleBooksResponse = await response.json();
        const thumbnail = data.items?.[0]?.volumeInfo?.imageLinks?.thumbnail;

        if (thumbnail) {
            const httpsThumbnail = thumbnail.replace('http://', 'https://');
            const imageResponse = await fetch(httpsThumbnail);
            const blob = await imageResponse.blob();
            return await blobToBase64(blob);
        }
        return null;
    } catch {
        return null;
    }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

export const fetchBooksWithCovers = async (books: Book[]): Promise<BookWithCover[]> => {
    const coverPromises = books.slice(0, 10).map(async (book) => {
        const coverImage = await fetchBookCoverByIsbn(book.isbn);
        return { ...book, coverImage: coverImage || undefined };
    });

    return await Promise.all(coverPromises);
};