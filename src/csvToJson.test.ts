import { describe, it, expect } from 'vitest';
import { csvToJSON } from './csvToJson';

describe('csvToJSON', () => {
    describe('with valid input', () => {
        it('should convert CSV to JSON with default values', () => {
            const input = [
                "name;age;city",
                "Diman;18;New York",
                "Denis;28;Los Angeles"
            ];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { name: 'Diman', age: 18, city: 'New York' },
                { name: 'Denis', age: 28, city: 'Los Angeles' }
            ]);
        });

        it('should convert numbers correctly', () => {
            const input = [
                "id;value",
                "1;52",
                "2;4.69",
                "3;100"
            ];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { id: 1, value: 52 },
                { id: 2, value: 4.69 },
                { id: 3, value: 100 }
            ]);
        });

        it('should handle different delimiters', () => {
            const input = [
                "name,age,city",
                "Diman,18,New York",
                "Denis,28,Los Angeles"
            ];
            
            const result = csvToJSON(input, ',');
            
            expect(result).toEqual([
                { name: 'Diman', age: 18, city: 'New York' },
                { name: 'Denis', age: 28, city: 'Los Angeles' }
            ]);
        });

        it('should handle strings with spaces', () => {
            const input = [
                "product;price",
                "Coffee; 4.99",
                "Tea; 3.50"
            ];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { product: 'Coffee', price: 4.99 },
                { product: 'Tea', price: 3.50 }
            ]);
        });

        it('should handle example from task', () => {
            const input = ["p1;p2;p3;p4", "1;A;b;c", "2;B;v;d"];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { p1: 1, p2: 'A', p3: 'b', p4: 'c' },
                { p1: 2, p2: 'B', p3: 'v', p4: 'd' }
            ]);
        });
    });

    describe('with invalid input', () => {
        it('should throw error for empty array', () => {
            expect(() => csvToJSON([], ';')).toThrow('Input array is empty');
        });

        it('should throw error for invalid headers', () => {
            const input = [""];
            expect(() => csvToJSON(input, ';')).toThrow('Invalid headers');
        });

        it('should throw error when column count mismatches', () => {
            const input = [
                "name;age;city",
                "Diman;18",
                "Denis;28;Los Angeles"
            ];
            
            expect(() => csvToJSON(input, ';')).toThrow('Row 1 has 2 columns, expected 3');
        });

        it('should throw error when more columns than headers', () => {
            const input = [
                "name;age",
                "Diman;18;New York",
                "Denis;28"
            ];
            
            expect(() => csvToJSON(input, ';')).toThrow('Row 1 has 3 columns, expected 2');
        });

        it('should handle empty values correctly', () => {
            const input = [
                "name;age;city",
                "Diman;;New York",
                "Denis;28;"
            ];
            
            const result = csvToJSON(input, ';');
            
            expect(result).toEqual([
                { name: 'Diman', age: '', city: 'New York' },
                { name: 'Denis', age: 28, city: '' }
            ]);
        });
    });
});