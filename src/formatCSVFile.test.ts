import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatCSVFileToJSONFile } from './csvToJson';

vi.mock('node:fs/promises', () => ({
    readFile: vi.fn(),
    writeFile: vi.fn()
}));

import { readFile, writeFile } from 'node:fs/promises';

describe('formatCSVFileToJSONFile', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('should read file, convert CSV to JSON, and write to output file', async () => {
        const mockCSVContent = 'name;age;city\nDiman;18;New York\nDenis;28;Los Angeles';
        vi.mocked(readFile).mockResolvedValue(mockCSVContent);

        await formatCSVFileToJSONFile('input.csv', 'output.json', ';');

        expect(readFile).toHaveBeenCalledTimes(1);
        expect(readFile).toHaveBeenCalledWith('input.csv', 'utf-8');

        expect(writeFile).toHaveBeenCalledTimes(1);
        
        const expectedJSON = JSON.stringify([
            { name: 'Diman', age: 18, city: 'New York' },
            { name: 'Denis', age: 28, city: 'Los Angeles' }
        ], null, 2);
        
        expect(writeFile).toHaveBeenCalledWith('output.json', expectedJSON, 'utf-8');
    });

    it('should handle empty lines in CSV file', async () => {
        const mockCSVContent = 'name;age;city\n\nDiman;18;New York\n\nDenis;28;Los Angeles\n';
        vi.mocked(readFile).mockResolvedValue(mockCSVContent);

        await formatCSVFileToJSONFile('input.csv', 'output.json', ';');

        const expectedJSON = JSON.stringify([
            { name: 'Diman', age: 18, city: 'New York' },
            { name: 'Denis', age: 28, city: 'Los Angeles' }
        ], null, 2);
        
        expect(writeFile).toHaveBeenCalledWith('output.json', expectedJSON, 'utf-8');
    });

    it('should throw error when CSV format is invalid', async () => {
        const mockCSVContent = 'name;age;city\nDiman;18\nDenis;28;Los Angeles';
        vi.mocked(readFile).mockResolvedValue(mockCSVContent);

        await expect(
            formatCSVFileToJSONFile('input.csv', 'output.json', ';')
        ).rejects.toThrow('Failed to process file');

        expect(writeFile).not.toHaveBeenCalled();
    });

    it('should throw error when file does not exist', async () => {
        vi.mocked(readFile).mockRejectedValue(new Error('File not found'));

        await expect(
            formatCSVFileToJSONFile('nonexistent.csv', 'output.json', ';')
        ).rejects.toThrow('Failed to process file');

        expect(writeFile).not.toHaveBeenCalled();
    });

    it('should handle different delimiter correctly', async () => {
        const mockCSVContent = 'name,age,city\nDiman,18,New York\nDenis,28,Los Angeles';
        vi.mocked(readFile).mockResolvedValue(mockCSVContent);

        await formatCSVFileToJSONFile('input.csv', 'output.json', ',');

        const expectedJSON = JSON.stringify([
            { name: 'Diman', age: 18, city: 'New York' },
            { name: 'Denis', age: 28, city: 'Los Angeles' }
        ], null, 2);
        
        expect(writeFile).toHaveBeenCalledWith('output.json', expectedJSON, 'utf-8');
    });
});