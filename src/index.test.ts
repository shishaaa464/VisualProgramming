import { it, describe, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest';
import { createUser, createBook, calculateArea, getStatusColor, capitalize, trimAndFormat, getFirstElement, findById } from './index';

describe('createUser', () => {
    beforeAll(() => {
        console.log("Начинаем тестирование createUser!");
    });

    afterAll(() => {
        console.log("Завершили тестирование createUser");
    });

    it('should create a user with required fields only', () => {
        const user = createUser(1, 'Denis');
        expect(user).toEqual({
            id: 1,
            name: 'Denis',
            isActive: true
        });
    });

    it('should create a user with email', () => {
        const user = createUser(2, 'Diman', 'Diman@example.com');
        expect(user).toEqual({
            id: 2,
            name: 'Diman',
            email: 'Diman@example.com',
            isActive: true
        });
    });

    it('should create a user with isActive false', () => {
        const user = createUser(3, 'Alex', undefined, false);
        expect(user).toEqual({
            id: 3,
            name: 'Alex',
            isActive: false
        });
    });
});

describe('createBook', () => {
    beforeEach(() => {
        console.log("Начинаем тест книги!");
    });

    afterEach(() => {
        console.log("Закончили тест книги!");
    });

    it('should create a book with all fields', () => {
        const book = createBook({
            title: 'Test Book',
            author: 'Test Author',
            year: 2022,
            genre: 'fiction'
        });
        expect(book).toEqual({
            title: 'Test Book',
            author: 'Test Author',
            year: 2022,
            genre: 'fiction'
        });
    });

    it('should create a book without year', () => {
        const book = createBook({
            title: 'Another Book',
            author: 'Another Author',
            genre: 'non-fiction'
        });
        expect(book).toEqual({
            title: 'Another Book',
            author: 'Another Author',
            genre: 'non-fiction'
        });
    });

    it('should have correct genre type', () => {
        const fictionBook = createBook({
            title: 'Fiction Book',
            author: 'Author',
            genre: 'fiction'
        });
        const nonFictionBook = createBook({
            title: 'Non-Fiction Book',
            author: 'Author',
            genre: 'non-fiction'
        });

        expect(fictionBook.genre).toBe('fiction');
        expect(nonFictionBook.genre).toBe('non-fiction');
    });
});

describe('calculateArea', () => {
    it('should calculate circle area correctly', () => {
        expect(calculateArea('circle', 5)).toBeCloseTo(78.53981633974483);
        expect(calculateArea('circle', 0)).toBe(0);
        expect(calculateArea('circle', 10)).toBeCloseTo(314.1592653589793);
    });

    it('should calculate square area correctly', () => {
        expect(calculateArea('square', 4)).toBe(16);
        expect(calculateArea('square', 0)).toBe(0);
        expect(calculateArea('square', 5)).toBe(25);
    });
});

describe('getStatusColor', () => {
    it('should return correct color for each status', () => {
        expect(getStatusColor('active')).toBe('green');
        expect(getStatusColor('inactive')).toBe('gray');
        expect(getStatusColor('new')).toBe('blue');
    });
});

describe('StringFormatter functions', () => {
    describe('capitalize', () => {
        it('should capitalize first letter only by default', () => {
            expect(capitalize('hello world')).toBe('Hello world');
            expect(capitalize('test')).toBe('Test');
        });

        it('should capitalize all letters when uppercase is true', () => {
            expect(capitalize('hello world', true)).toBe('HELLO WORLD');
            expect(capitalize('test', true)).toBe('TEST');
        });

        it('should handle empty string', () => {
            expect(capitalize('')).toBe('');
        });
    });

    describe('trimAndFormat', () => {
        it('should trim whitespace by default', () => {
            expect(trimAndFormat('  hello world  ')).toBe('hello world');
            expect(trimAndFormat('\n\ttest\n\t')).toBe('test');
        });

        it('should trim and uppercase when uppercase is true', () => {
            expect(trimAndFormat('  hello world  ', true)).toBe('HELLO WORLD');
            expect(trimAndFormat('\n\ttest\n\t', true)).toBe('TEST');
        });

        it('should handle empty string', () => {
            expect(trimAndFormat('')).toBe('');
            expect(trimAndFormat('   ', true)).toBe('');
        });
    });
});

describe('getFirstElement', () => {
    it('should return first element of number array', () => {
        expect(getFirstElement([1, 2, 3])).toBe(1);
        expect(getFirstElement([52])).toBe(52);
    });

    it('should return first element of string array', () => {
        expect(getFirstElement(['a', 'b', 'c'])).toBe('a');
        expect(getFirstElement(['hello'])).toBe('hello');
    });

    it('should return undefined for empty array', () => {
        expect(getFirstElement([])).toBeUndefined();
    });
});

describe('findById', () => {
    const testArray = [
        { id: 1, name: 'Denis' },
        { id: 2, name: 'Diman' },
        { id: 3, name: 'Alex', age: 25 }
    ];

    it('should find object by id', () => {
        expect(findById(testArray, 2)).toEqual({ id: 2, name: 'Diman' });
        expect(findById(testArray, 1)).toEqual({ id: 1, name: 'Denis' });
    });

    it('should return undefined for non-existent id', () => {
        expect(findById(testArray, 999)).toBeUndefined();
    });

    it('should work with objects that have additional properties', () => {
        expect(findById(testArray, 3)).toEqual({ id: 3, name: 'Alex', age: 25 });
    });

    it('should return undefined for empty array', () => {
        expect(findById([], 1)).toBeUndefined();
    });
});