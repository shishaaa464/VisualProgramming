import { useEffect, useState } from 'react';
import BookCard from './BookCard';
import { fetchBooks, fetchBookCoverByIsbn } from './bookApi';
import type { BookWithCover } from './Book';

function App() {
    const [books, setBooks] = useState<BookWithCover[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadBooks = async () => {
            try {
                setLoading(true);
                const booksData = await fetchBooks();
                const limitedBooks = booksData.slice(0, 50);

                setBooks(limitedBooks.map(book => ({ ...book, coverImage: undefined })));
                setLoading(false);

                for (const book of limitedBooks) {
                    const coverImage = await fetchBookCoverByIsbn(book.isbn);
                    setBooks(prev => prev.map(b =>
                        b.id === book.id ? { ...b, coverImage: coverImage || undefined } : b
                    ));
                }
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        loadBooks();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-stone-500">Загрузка книг...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-100 p-8">
            <h1 className="text-4xl font-serif font-black text-center mb-12 text-stone-800 border-b-2 border-stone-300 pb-4 max-w-2xl mx-auto">
                КАТАЛОГ КНИГ
            </h1>
            <div className="flex flex-wrap gap-6 justify-center">
                {books.map((book) => (
                    <BookCard
                        key={book.id}
                        title={book.title}
                        authors={book.authors}
                        coverId={book.id % 1000000}
                    />
                ))}
            </div>
        </div>
    );
}

export default App;