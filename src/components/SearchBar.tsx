import React, { useState } from 'react';

interface Props {
    onSearch: (city: string) => void;
}

const SearchBar: React.FC<Props> = ({ onSearch }) => {
    const [input, setInput] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim()) onSearch(input);
    };

    return (
        <form onSubmit={handleSubmit} className="search-bar">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Введите город..."
            />
            <button type="submit">Поиск</button>
        </form>
    );
};

export default SearchBar;