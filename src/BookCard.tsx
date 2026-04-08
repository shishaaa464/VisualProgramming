import React, { useEffect, useState } from 'react';

interface BookCardProps {
    title: string;
    authors: string[];
    coverId?: number;
}

const BookCard: React.FC<BookCardProps> = ({ title, authors, coverId }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const basePrice = coverId ? (coverId % 1000) + 500 : 990;
    const discountPercent = coverId ? (coverId % 30) + 10 : 15;
    const finalPrice = Math.floor(basePrice * (1 - discountPercent / 100));

    useEffect(() => {
        if (!coverId) return;
        const fetchCover = async () => {
            try {
                const url = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
                const res = await fetch(url);
                const blob = await res.blob();
                if (blob.size > 100) {
                    setBlobUrl(URL.createObjectURL(blob));
                }
            } catch (e) { }
        };
        fetchCover();
        return () => { if (blobUrl) URL.revokeObjectURL(blobUrl); };
    }, [coverId]);

    return (
        <div className="flex flex-col w-[200px] bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="w-full h-[280px] bg-slate-100 relative">
                {blobUrl ? (
                    <img src={blobUrl} alt={title} className="w-full h-full object-cover" />
                ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-slate-400 font-bold p-4 text-center uppercase">
                        Загрузка обложек...
                    </div>
                )}
            </div>

            <div className="p-3 flex flex-col flex-grow">
                <h3 className="text-sm font-bold text-slate-900 leading-tight mb-1 line-clamp-2 min-h-[40px]">
                    {title}
                </h3>
                <p className="text-[11px] text-slate-500 truncate mb-3">
                    {authors.join(', ')}
                </p>
                <div className="mt-auto pt-2 border-t border-slate-100">
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-red-500 font-bold text-base">{finalPrice} ₽</span>
                        <span className="text-slate-400 text-xs line-through">{basePrice} ₽</span>
                        <span className="text-green-600 text-xs font-semibold bg-green-50 px-1.5 py-0.5 rounded">
                            -{discountPercent}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookCard;