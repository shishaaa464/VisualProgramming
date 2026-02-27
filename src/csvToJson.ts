import { readFile, writeFile } from 'node:fs/promises';

export function csvToJSON(input: string[], delimiter: string): object[] {
    if (input.length === 0) {
        throw new Error('Input array is empty');
    }

    const headers = input[0]?.split(delimiter) ?? [];
    
    if (headers.length === 0 || (headers.length === 1 && headers[0] === '')) {
        throw new Error('Invalid headers');
    }

    const result: object[] = [];

    for (let i = 1; i < input.length; i++) {
        const currentRow = input[i];
        if (!currentRow) {
            throw new Error(`Row ${i} is empty`);
        }
        
        const values = currentRow.split(delimiter);
        
        if (values.length !== headers.length) {
            throw new Error(`Row ${i} has ${values.length} columns, expected ${headers.length}`);
        }

        const obj: Record<string, string | number> = {};
        for (let j = 0; j < headers.length; j++) {
            const header = headers[j];
            if (!header) {
                throw new Error(`Header at index ${j} is empty`);
            }
            
            const valueStr = values[j];
            if (valueStr === undefined) {
                throw new Error(`Value at row ${i}, column ${j} is undefined`);
            }
            
            const trimmedHeader = header.trim();
            const trimmedValue = valueStr.trim();
            
            let value: string | number = trimmedValue;
            if (trimmedValue !== '' && !isNaN(Number(trimmedValue))) {
                value = Number(trimmedValue);
            }
            
            obj[trimmedHeader] = value;
        }
        
        result.push(obj);
    }

    return result;
}

export async function formatCSVFileToJSONFile(
    input: string, 
    output: string, 
    delimiter: string
): Promise<void> {
    try {
        const fileContent = await readFile(input, 'utf-8');
        
        const lines = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => line !== '');
        
        if (lines.length === 0) {
            throw new Error('File is empty');
        }
        
        const jsonData = csvToJSON(lines, delimiter);
        
        await writeFile(output, JSON.stringify(jsonData, null, 2), 'utf-8');
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to process file: ${error.message}`);
        } else {
            throw new Error('Failed to process file: Unknown error');
        }
    }
}